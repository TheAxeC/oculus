// Layer 2, client state. What a refusal code of the file browser's endpoint says to the reader. It
// is a file of its own so the view's component and the palette's workspace commands share one
// table of words. The codes named here are the ones POST /api/fs
// (server/files/fs.ts's handleFsWrite) refuses an action on a root, a workspace or a note with; the
// four it refuses a request with before any action is read (`origin`, `token`, `not-json`,
// `not-an-action`), and any code added later, are said with the code itself.

import { t } from '../../../shared/words/text.ts';

/** What one refusal code from the endpoint says to the reader. */
export function refusal(code: string, reason?: string): string {
    if (code === 'no-dir') return t('files.refused_no_dir');
    if (code === 'not-absolute') return t('files.refused_not_absolute');
    if (code === 'no-such-dir') return t('files.refused_no_such_dir');
    if (code === 'not-a-directory') return t('files.refused_not_a_directory');
    if (code === 'root-held') return t('files.refused_root_held');
    if (code === 'no-such-root') return t('files.refused_no_such_root');
    if (code === 'no-name') return t('files.refused_no_name');
    if (code === 'name-held') return t('files.refused_name_held');
    if (code === 'bad-name') return t('files.refused_bad_name');
    if (code === 'no-hub') return t('files.refused_no_hub');
    if (code === 'gone') return t('files.refused_gone');
    if (code === 'unreadable') return t('files.refused_unreadable', reason ?? '');
    if (code === 'unwritable') return t('files.refused_unwritable');
    if (code === 'no-such-note') return t('files.refused_no_such_note');
    if (code === 'notes-order-unreadable') return t('files.refused_notes_order_unreadable');
    if (code === 'roots-changed') return t('files.refused_roots_changed');
    if (code === 'invalid') return t('files.refused_roots_invalid');
    return t('files.refused_other', code);
}
