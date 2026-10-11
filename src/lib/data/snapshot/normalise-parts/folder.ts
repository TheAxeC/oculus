// Layer 1, data. What a project's folder holds, as the snapshot says it: the fixed documents by
// presence, read for normalise.ts.

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
