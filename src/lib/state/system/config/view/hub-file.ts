// Layer 2, client state. A file of a workspace folder that a Settings scope reads and writes, as
// the file browser holds it: a hub's settings file, `.oculus/config.yml`, or a repository's
// `.oculus/settings.yml`. Whether the file is there is read from the listings of the folders on
// its way (the folder root and `.oculus`), since a read that fails cannot tell an absent file from
// one that cannot be read. A listing or text still being read makes the file loading, a listing
// that failed makes it unreadable with the reason, and a file that is not in its folder is absent,
// which reads as an empty file.

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
 * The file at `file` of a folder, the hub's settings file when none is named. `listing` answers
 * the listing of a folder of it (the empty path is the folder root) and `text` the text of a file
 * of it.
 */
export function hubFileText(
    listing: ListingOf,
    text: (path: string) => FileText,
    file: string = HUB_FILE
): HubFile {
    const steps = file.split('/');
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
    return { text: text(file), present: true };
}
