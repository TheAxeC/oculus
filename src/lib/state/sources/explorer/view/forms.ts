// Layer 2, client state, pure. The forms of the Files view: which line form is open over the trees
// (a root's folder or a workspace's name) and the text typed into it. A saved record that names one
// is closed by the view, since no control opens either now.

/** Which form is open over the trees: a root's folder, a workspace's name, or none. */
export type FilesForm = 'root' | 'workspace' | '';

/**
 * The forms of one file browser: which one is open and the text typed into it. The text is '' where
 * no form is open.
 */
export type FilesForms = { form: FilesForm; typed: string };

/** Whether a form is one of the two a line of text is typed into. */
export function isLineForm(form: FilesForm): boolean {
    return form === 'root' || form === 'workspace';
}
