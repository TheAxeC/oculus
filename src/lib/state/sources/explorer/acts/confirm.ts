// Layer 2, client state. Whether a delete to the Trash asks first: `files.confirm_delete` of the
// merged configuration the page holds, true until the configuration says false. The reader is the
// data layer's, the one every setting is read through; the Files view takes it from here.

import type { WriteAnswer } from '../../../shared/stores/shapes';

export { confirmDelete } from '../../../../data/sources/config/settings/files.ts';

/**
 * What a question's answer does to the setting: a yes with the "Do not ask me again" box ticked
 * writes the behavior.yml option `files.confirm_delete` as false, which lands in the open workspace
 * file's `settings:`; any other answer writes nothing. Returns whether a write was sent.
 */
export function rememberAnswer(
    write: (file: string, key: string, value: unknown) => Promise<WriteAnswer>,
    confirmed: boolean,
    forget: boolean
): boolean {
    if (!confirmed || !forget) return false;
    void write('behavior.yml', 'files.confirm_delete', false);
    return true;
}
