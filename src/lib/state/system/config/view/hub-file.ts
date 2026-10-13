// Layer 2, client state. The hub's settings file for the Settings view: `.oculus/config.yml` in
// the hub's root, as the file browser holds it. Whether the file is there is read from the
// listings of the folders on its way (the hub root and `.oculus`), since a read that fails cannot
// tell an absent file from one that cannot be read. A listing or text still being read makes the
// file loading, a listing that failed makes it unreadable with the reason, and a file that is not
// in its folder is absent, which reads as an empty file.

import { HUB_FILE } from '../../../../data/helpers/hub-names.ts';
import type { FileText } from '../../../sources/fs-transport.ts';
import type { HubFile } from '../rows.ts';
import type { ListingOf } from './folders.ts';

/** The text of a loading, an unreadable or an absent file: nothing, with the state it is in. */
function noText(state: { loading?: boolean; error?: string }): FileText {
    return {
        text: '',
        truncated: false,
        error: state.error ?? '',
        loading: state.loading === true
    };
}

/**
 * The hub's settings file. `listing` answers the listing of a folder of the hub (the empty path is
 * the hub root) and `text` the text of a file of it.
 */
export function hubFileText(listing: ListingOf, text: (path: string) => FileText): HubFile {
    const steps = HUB_FILE.split('/');
    let folder = '';
    for (const [at, step] of steps.entries()) {
        const held = listing(folder);
        if (held.error !== '') return { text: noText({ error: held.error }), present: true };
        if (held.loading) return { text: noText({ loading: true }), present: true };
        const kind = at === steps.length - 1 ? 'file' : 'dir';
        const found = held.entries.some((entry) => entry.name === step && entry.kind === kind);
        if (!found) return { text: noText({}), present: false };
        folder = folder === '' ? step : `${folder}/${step}`;
    }
    return { text: text(HUB_FILE), present: true };
}
