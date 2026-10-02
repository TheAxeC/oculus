// Layer 2, client state, pure. The forms of the Files view: which one is open over the trees (a
// root's folder, a workspace's name, a bookmark), what was typed into a line form, and how a press
// or an answer moves from one set of forms to the next.
//
// A request that closes a form answers after the reader may have opened another form, closed the
// form and opened the same one again, typed on in it, or closed the tab. Each opening carries a
// count, and an answer closes only the opening it was sent from, still holding what it held.

/** Which form is open over the trees: a root's folder, a workspace's name, a bookmark, or none. */
export type FilesForm = 'root' | 'workspace' | 'bookmark' | '';

/**
 * The forms of one file browser: which one is open, the bookmark the bookmark form edits ('' while
 * it adds one), the text typed into the root or the workspace line form, and how many times a press
 * has opened or closed a form. Each string is '' where the open form does not have it, so a record
 * naming a bookmark while no bookmark form is open names nothing. The count tells one opening of a
 * form from the next opening of the same form, which is what an answer to a request from the first
 * must not close.
 */
export type FilesForms = { form: FilesForm; editing: string; typed: string; opening: number };

/** Whether a form is one of the two a line of text is typed into. */
export function isLineForm(form: FilesForm): boolean {
    return form === 'root' || form === 'workspace';
}

/** The forms part of a file browser's state, which is what a request is sent from. */
export function formsOf(view: FilesForms): FilesForms {
    return { form: view.form, editing: view.editing, typed: view.typed, opening: view.opening };
}

/**
 * The forms a section's own control leaves: the form it names opens, or closes when it is the one
 * open, and a bookmark form open over an entry gives way to the one that adds. Whatever line of
 * text was typed goes with the form it was typed into.
 */
export function formShown(now: FilesForms, which: Exclude<FilesForm, ''>): FilesForms {
    const closing = now.form === which && now.editing === '';
    return { form: closing ? '' : which, editing: '', typed: '', opening: now.opening + 1 };
}

/**
 * The forms a bookmark row's edit control leaves: that bookmark's form, or none when it was open.
 */
export function editShown(now: FilesForms, id: string): FilesForms {
    const same = now.form === 'bookmark' && now.editing === id;
    return {
        form: same ? '' : 'bookmark',
        editing: same ? '' : id,
        typed: '',
        opening: now.opening + 1
    };
}

/**
 * Whether the bookmark form is open over a bookmark the bookmarks file no longer holds, read once
 * the file has been read without an error. Such a form has nothing to draw and nothing to save
 * into.
 *
 * A form with a save of its own out (`saving`) is not one of them until its answer lands: a write
 * from elsewhere on the page can take the bookmark away while the reader is typing into that form,
 * and closing it then would take the words out from under them. Once the answer has landed the form
 * is read like any other.
 */
export function editedGone(
    now: FilesForms,
    marks: { entries: { id: string }[]; loading: boolean; error: string },
    saving: boolean
): boolean {
    if (now.form !== 'bookmark' || now.editing === '') return false;
    if (marks.loading || marks.error !== '' || saving) return false;
    return !marks.entries.some((one) => one.id === now.editing);
}

/**
 * The bookmark form a move from one set of forms to the next closes, as the bookmark it edited (''
 * for the form that adds), or null when no bookmark form closes. A move that keeps the same
 * bookmark form open closes nothing.
 */
export function bookmarkLeft(now: FilesForms, next: FilesForms): { editing: string } | null {
    if (now.form !== 'bookmark') return null;
    if (next.form === 'bookmark' && next.editing === now.editing) return null;
    return { editing: now.editing };
}

/**
 * The forms an answer that closes a form leaves, or null when the form it answers is no longer the
 * one open. An answer arrives after its request went: by then the reader may have opened another
 * form, closed the form and opened the same one again, typed on in it, or closed the tab, which
 * takes the whole record away. Only the opening the request was made from, still holding what it
 * held, is closed by it.
 */
export function formSettled(now: FilesForms, asked: FilesForms): FilesForms | null {
    const same =
        now.form === asked.form &&
        now.editing === asked.editing &&
        now.typed === asked.typed &&
        now.opening === asked.opening;
    return same && asked.form !== ''
        ? { form: '', editing: '', typed: '', opening: now.opening }
        : null;
}
