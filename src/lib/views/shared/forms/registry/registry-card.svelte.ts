// Layer 3, view helper of the cards of a registry record: the Domains and the Pillars line cards,
// the Data view's DatasetCard.svelte and the Venues view's VenueCard.svelte, each drawn as the
// record card (views/shared/card/record/RecordCard.svelte). What every such card takes and holds:
// the props of a record of a registry file, the entry the question before a delete is open for,
// the record's page, Page, Edit in File and Delete, disabled with the words saying why while the
// file cannot be written, and what the card's Add run writes. A card makes its own with
// `createRegistryCard` in its script, so nothing is held at module level.

import type { Entry, IdentityFault, Project, SchemaField } from '$lib/state/boards/collection';
import type { ClientState } from '$lib/state/client/context';
import { pageView } from '$lib/state/forms/page-entry';
import type { ViewSource } from '$lib/state/sessions/view-source';
import { pageAction, type RecordAction, type RecordDated } from '../../card/record/record-menu';
import { blockedBy } from '../entry-file';
import { entryDated, recordActions } from '../entry/entry-actions';

/** The props every card of a registry record takes beside the record itself. */
export type RegistryCardProps = {
    /** Whether keyboard navigation has selected this card. */
    cursor: boolean;
    projects: Project[];
    /** The file's entry for this record, or null for a record the file does not hold. */
    entry: Entry | null;
    schema: SchemaField[] | undefined;
    /** The registry file, which Edit in File opens; null when the configuration names none. */
    file: ViewSource | null;
    fault: IdentityFault | undefined;
    onsaid: (said: string) => void;
};

/** What a card of a registry record holds, read through getters so each stays reactive. */
export type RegistryCardState = {
    /** The entry the question before a delete is open for, the record card's `deleting`. */
    readonly deleting: { collection: string; id: string; onclose: () => void } | undefined;
    /** Page, Edit in File and Delete, for a record the file holds. */
    readonly actions: RecordAction[];
    /** The record's lines and deadline, which the card's Add run writes; none with no schema. */
    readonly dated: RecordDated | undefined;
    /** Opens the record's page, for a record the file holds. */
    readonly onpage: (() => void) | undefined;
};

/**
 * What the record's actions are made from, of the card's props: the key the record's hub gives
 * the registry, which its page and its writes name, and the words its page tab is titled by.
 */
export type RegistryCardTarget = Pick<
    RegistryCardProps,
    'entry' | 'schema' | 'file' | 'fault' | 'onsaid'
> & { collection: string; title: string };

/** The state of one card, from the client and the card's current props. */
export function createRegistryCard(
    client: ClientState,
    props: () => RegistryCardTarget
): RegistryCardState {
    let asking = $state(false);
    const ask = (): void => {
        asking = true;
    };
    const close = (): void => {
        asking = false;
    };
    const deleting = $derived.by(() => {
        const { entry, collection } = props();
        return asking && entry !== null ? { collection, id: entry.id, onclose: close } : undefined;
    });
    const blocked = $derived.by(() => {
        const { file, fault } = props();
        const unsaved = file !== null && client.source.unsavedFile(file.root, file.path);
        return blockedBy(file, unsaved, fault);
    });
    const onpage = $derived.by(() => {
        const { entry, collection, title } = props();
        if (entry === null) return undefined;
        return (): void => {
            const page = pageView(collection, entry.id, title);
            client.layout.openView(page.view, page.state);
        };
    });
    const actions = $derived.by((): RecordAction[] => {
        const { file, entry, schema, fault, onsaid } = props();
        const own = recordActions({ client, file, entry, schema, fault, onsaid }, blocked, ask);
        return onpage === undefined ? own : [pageAction(onpage), ...own];
    });
    const dated = $derived.by(() => {
        const { entry, schema, collection } = props();
        return entry === null
            ? undefined
            : entryDated(client, collection, entry, schema, blocked, true);
    });
    return {
        get deleting() {
            return deleting;
        },
        get actions() {
            return actions;
        },
        get dated() {
            return dated;
        },
        get onpage() {
            return onpage;
        }
    };
}
