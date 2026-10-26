// Layer 3, shared view support. The file a registry view (Venues, Data, Pillars, Domains) is drawn
// from, and what its Add, Delete and Edit in File controls need of it: the collection of the entry
// of each hub's list whose `registry:` names the view's registry, the file's source address, the
// identities a write cannot address, the sentence the last Delete or Edit in File answered, and the
// Add box. A view makes one at its start and reads it by property. An entry of a hub other than the
// primary is read from that hub's own registry file, so its card edits that file with that file's
// schema and identities; Add writes the primary's.

import type { ClientState } from '$lib/state/client/context';
import { fileUnder, rootOf } from '$lib/state/shared/page/hubs';
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
import { collectionAsk, type Ask } from '../entry/entry-add';

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
    /** The registry file that holds the entry of the id; the primary hub's when none does. */
    sourceOf: (id: string) => ViewSource | null;
    /** Why a write cannot address the entry, from the identities of the file that holds it. */
    faultOf: (id: string) => IdentityFault | undefined;
    /** The Add box while it is open: it asks the new entry's name and opens the entry's page. */
    readonly asking: Ask | null;
    /** Open the Add box. */
    add: () => void;
    /** Close the Add box. */
    closeAsk: () => void;
};

/**
 * The file of the registry view of `kind`, whose entries are the collection of each hub whose
 * entry names that registry, under the key its own list gives it. Called while a component
 * initialises, since it makes deriveds.
 */
export function registryFile(client: ClientState, kind: RegistryKind): RegistryFile {
    const { configMap, registryCollections, registryKey } = client.selectors;
    /** The registry's collection of each hub that holds one, the primary hub's first. */
    const held = $derived(registryCollections(kind));
    const collection = $derived(held.find((one) => rootOf(one) === client.fs.primary()) ?? null);
    const source = $derived(viewSourceFile(kind, configMap(), client.fs.primary()));
    /** The registry file of each hub that holds one, the primary hub's first. */
    const parts = $derived(
        held.map((one) => ({
            collection: one,
            file:
                rootOf(one) === client.fs.primary()
                    ? source
                    : fileUnder(one.file, client.fs.roots(), client.fs.primary()),
            faults: identityFaults(one.entries, one.schema)
        }))
    );
    /** The part whose file holds the entry of the id. */
    const partOf = (id: string) => parts.find((one) => entryById(one.collection, id) !== null);
    let said = $state('');
    let asking = $state<Ask | null>(null);
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
        get asking() {
            return asking;
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
        add: () => {
            const key = registryKey(kind);
            const title = collection?.title ?? key;
            asking = collectionAsk(client, key, collection?.schema, title, undefined, held);
        },
        closeAsk: () => {
            asking = null;
        }
    };
}
