// Layer 3, view helper of the cards of a registry record (RegistryCard.svelte, which the Domains
// and the Pillars cards draw, and the Data view's DatasetCard.svelte). What every such card takes
// and holds: the props of a record of a registry file, whether the question before a delete is
// open, why the controls that write are disabled, and Edit in File and Delete. A card makes its
// own with `createRecordCard` in its script, so nothing is held at module level.

import type { Entry, IdentityFault, Project, SchemaField } from '$lib/state/boards/collection';
import type { ClientState } from '$lib/state/client/context';
import type { ViewSource } from '$lib/state/sessions/view-source';
import type { CardAction } from '../../card/card';
import { blockedBy } from '../entry-file';
import { recordActions } from '../entry/entry-actions';

/** The props every card of a registry record takes beside the record itself. */
export type RecordCardProps = {
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
export type RecordCard = {
    /** True while the question before a delete is open. */
    readonly deleting: boolean;
    /** Why the controls that write are disabled, '' when they are not. */
    readonly blocked: string;
    /** Edit in File and Delete, for a record the file holds. */
    readonly actions: CardAction[];
    /** Opens the question before a delete. */
    ask: () => void;
    /** Shuts the question before a delete. */
    close: () => void;
};

/** What the record's controls are made from, of the card's props. */
export type RecordCardTarget = Pick<
    RecordCardProps,
    'entry' | 'schema' | 'file' | 'fault' | 'onsaid'
>;

/** The state of one card, from the client and the card's current props. */
export function createRecordCard(client: ClientState, props: () => RecordCardTarget): RecordCard {
    let deleting = $state(false);
    const ask = (): void => {
        deleting = true;
    };
    const blocked = $derived.by(() => {
        const { file, fault } = props();
        const unsaved = file !== null && client.source.unsavedFile(file.root, file.path);
        return blockedBy(file, unsaved, fault);
    });
    const actions = $derived.by(() => {
        const { file, entry, schema, fault, onsaid } = props();
        return recordActions({ client, file, entry, schema, fault, onsaid }, blocked, ask);
    });
    return {
        get deleting() {
            return deleting;
        },
        get blocked() {
            return blocked;
        },
        get actions() {
            return actions;
        },
        ask,
        close: () => {
            deleting = false;
        }
    };
}
