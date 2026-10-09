// Layer 2, client state. The hub layer's file of a config file for the Settings view: the file of
// the same name under `.oculus/config/` in the hub's root, as the file browser holds it. Whether
// the file is there is read from the listings of the folders on its way (the hub root, `.oculus`,
// `config` and the folders the name passes through), since a read that fails cannot tell an absent
// file from one that cannot be read. A listing or text still being read makes the layer loading, a
// listing that failed makes it unreadable with the reason, and a file that is not in its folder is
// absent, which reads as an empty layer.

import { hubLayerPath } from '../../../../data/helpers/hub-names.ts';
import type { FileText } from '../../../sources/fs-transport.ts';
import type { HubLayer } from '../rows.ts';
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
 * The hub layer's file of one config file. `listing` answers the listing of a folder of the hub
 * (the empty path is the hub root) and `text` the text of a file of it.
 */
export function hubLayerText(
    file: string,
    listing: ListingOf,
    text: (path: string) => FileText
): HubLayer {
    const path = hubLayerPath(file);
    const steps = path.split('/');
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
    return { text: text(path), present: true };
}
