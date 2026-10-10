// Layer 1, data. What a project's folder holds, as the snapshot says it: the fixed documents by
// presence. A research project and a side project say it the same way, so the one function is here
// for normalise.ts and for the side project's reader.

import type { DocFlag, DocPresence } from '../../model/index.ts';
import { compact } from '../compact.ts';

/** The documents of one folder, without the absolute path the presence check carries. */
export function docFlags(found: DocPresence[] | undefined): DocFlag[] {
    return (found ?? []).map((doc) =>
        compact({
            name: doc.name,
            label: doc.label,
            present: doc.present,
            human: doc.human,
            mtime: doc.present && doc.mtime > 0 ? doc.mtime : undefined
        })
    );
}
