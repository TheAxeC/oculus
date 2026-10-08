// Layer 3, shared view support. The file a registry view (Venues, Data, Pillars, Domains) is drawn
// from, and what its Add and Edit in File controls need of it: the collection read from the file,
// the file's source address, the identities a write cannot address, the sentence the last Add or
// Edit in File answered, and Add itself. A view makes one at its start and reads it by property.

import type { ClientState } from '$lib/state/client/context';
import {
    entryById,
    identityFaults,
    type Collection,
    type Entry,
    type IdentityFault
} from '$lib/state/boards/collection';
import {
    viewSourceFile,
    type RegistryKind,
    type ViewSource
} from '$lib/state/sessions/view-source';
import { addInFile } from '../entry-file';

/** The file of one registry view and the reads and acts its controls make of it. */
export type RegistryFile = {
    readonly collection: Collection | null;
    /** The registry file the control at the end of the toolbar opens; null when none is named. */
    readonly source: ViewSource | null;
    /** The sentence of the last Add or Edit in File, '' when it went through. */
    readonly said: string;
    say: (words: string) => void;
    entryOf: (id: string) => Entry | null;
    /** Why a write cannot address the entry, from the file's identities. */
    faultOf: (id: string) => IdentityFault | undefined;
    /** Add opens the registry file with a new entry in its unsaved text and the caret in it. */
    add: () => Promise<void>;
};

/**
 * The file of the registry view of `kind`, whose entries are the collection `key`. Called while a
 * component initialises, since it makes deriveds.
 */
export function registryFile(client: ClientState, kind: RegistryKind, key: string): RegistryFile {
    const { collectionOf, configMap } = client.selectors;
    const collection = $derived(collectionOf(key));
    const source = $derived(viewSourceFile(kind, configMap()));
    const faults = $derived(identityFaults(collection?.entries ?? [], collection?.schema));
    let said = $state('');
    return {
        get collection() {
            return collection;
        },
        get source() {
            return source;
        },
        get said() {
            return said;
        },
        say: (words) => {
            said = words;
        },
        entryOf: (id) => entryById(collection, id),
        faultOf: (id) => {
            const entry = entryById(collection, id);
            return entry === null ? undefined : faults.get(entry.index);
        },
        add: async () => {
            if (source === null) return;
            said = await addInFile(client, source, collection?.schema, key);
        }
    };
}
