// Layer 3, shared view support. The file a registry view (Venues, Data, Pillars, Domains) is drawn
// from, and what its Add and Edit in File controls need of it: the collection read from the file,
// the file's source address, the identities a write cannot address, the sentence the last Add or
// Edit in File answered, and Add itself. A view makes one at its start and reads it by property.
// An entry of a hub other than the first is read from that hub's own registry file, so its card
// edits that file with that file's schema and identities; Add writes the first hub's.

import type { ClientState } from '$lib/state/client/context';
import { HUB_ROOT, fileUnder, rootOf } from '$lib/state/shared/page/hubs';
import {
    entryById,
    identityFaults,
    type Collection,
    type Entry,
    type IdentityFault,
    type SchemaField
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
    /** The entry of the id, in the registry file of the hub that holds it; null when none does. */
    entryOf: (id: string) => Entry | null;
    /** The schema of the registry file that holds the entry of the id. */
    schemaOf: (id: string) => SchemaField[] | undefined;
    /** The registry file that holds the entry of the id; the first hub's when none does. */
    sourceOf: (id: string) => ViewSource | null;
    /** Why a write cannot address the entry, from the identities of the file that holds it. */
    faultOf: (id: string) => IdentityFault | undefined;
    /** Add opens the registry file with a new entry in its unsaved text and the caret in it. */
    add: () => Promise<void>;
};

/**
 * The file of the registry view of `kind`, whose entries are the collection `key`. Called while a
 * component initialises, since it makes deriveds.
 */
export function registryFile(client: ClientState, kind: RegistryKind, key: string): RegistryFile {
    const { collectionOf, collectionsOfKey, configMap } = client.selectors;
    const collection = $derived(collectionOf(key));
    const source = $derived(viewSourceFile(kind, configMap()));
    /** The registry file of each hub that holds one, the first hub's first. */
    const parts = $derived(
        collectionsOfKey(key).map((one) => ({
            collection: one,
            file: rootOf(one) === HUB_ROOT ? source : fileUnder(one.file, client.fs.roots()),
            faults: identityFaults(one.entries, one.schema)
        }))
    );
    /** The part whose file holds the entry of the id. */
    const partOf = (id: string) => parts.find((one) => entryById(one.collection, id) !== null);
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
        entryOf: (id) => entryById(partOf(id)?.collection, id),
        schemaOf: (id) => partOf(id)?.collection.schema,
        sourceOf: (id) => partOf(id)?.file ?? source,
        faultOf: (id) => {
            const part = partOf(id);
            const entry = entryById(part?.collection, id);
            return entry === null ? undefined : part?.faults.get(entry.index);
        },
        add: async () => {
            if (source === null) return;
            said = await addInFile(client, source, collection?.schema, key);
        }
    };
}
