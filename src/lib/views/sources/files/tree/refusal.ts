// Layer 3, partial of views/sources/files/Files.svelte. What a refusal code of the file browser's
// endpoint says to the reader. It is a file of its own so the view's component holds its state and
// its markup and not a table of words. The codes named here are the ones POST /api/fs
// (server/files/fs.ts's handleFsWrite) refuses an action on a root, a workspace or a note with; the
// four it refuses a request with before any action is read (`origin`, `token`, `not-json`,
// `not-an-action`), and any code added later, are said with the code itself.

import { t } from '$lib/state/shared/words/text';

/** What one refusal code from the endpoint says to the reader. */
export function refusal(code: string): string {
    if (code === 'no-dir') return t('files.refused_no_dir');
    if (code === 'not-absolute') return t('files.refused_not_absolute');
    if (code === 'no-such-dir') return t('files.refused_no_such_dir');
    if (code === 'not-a-directory') return t('files.refused_not_a_directory');
    if (code === 'root-held') return t('files.refused_root_held');
    if (code === 'root-fixed') return t('files.refused_root_fixed');
    if (code === 'no-such-root') return t('files.refused_no_such_root');
    if (code === 'no-name') return t('files.refused_no_name');
    if (code === 'name-held') return t('files.refused_name_held');
    if (code === 'no-such-workspace') return t('files.refused_no_such_workspace');
    if (code === 'no-such-note') return t('files.refused_no_such_note');
    return t('files.refused_other', code);
}
