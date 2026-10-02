// Layer 2, client state. New Text File's opener over the layout's openInPane: a Note with an id
// taken from the moment of the press and `fresh`, so the tab starts empty and asks the server for
// no file.

import { noteId } from '../../../life/notes.ts';

/** The opener of a scratch Note in the pane at `path` of `page`. */
export function newNoteOpener(
    openInPane: (view: string, state: unknown, page: string, path: number[]) => string,
    now: () => Date = () => new Date()
): (page: string, path: number[]) => void {
    return (page, path) => {
        openInPane('note', { id: noteId(now()), fresh: true }, page, path);
    };
}
