// Layer 3, view helper of views/boards/collection/EntryCard.svelte. The controls one entry's card
// carries in its meta row, from what the card knows: whether a write can address the entry, why the
// controls that write are disabled, and the handlers the card gives each.

import { t } from '$lib/state/shared/words/text';
import type { CardAction } from '../../shared/card/CardActions.svelte';

/** What the card's controls are made from. */
export type EntryActionInput = {
    /** True for an entry of a file with a schema; one without carries status buttons only. */
    addressable: boolean;
    /** The words saying why the controls that write are disabled, '' when they are not. */
    blocked: string;
    /** The name of the file Edit in File opens. */
    fileName: string;
    status: string | undefined;
    /** The lifecycle statuses of a file with no schema, offered as buttons. */
    statuses: string[];
    pinned: boolean;
    /** Whether the entry has no subtask, so adding the first is a control of the card. */
    firstSubtask: boolean;
    addingSubtask: boolean;
    /** The Show in Files controls and the controls the collection adds, drawn after the rest. */
    shows: CardAction[];
    extra: CardAction[];
    onstatus: (next: string) => void;
    onpin: () => void;
    onedit: () => void;
    onsubtask: () => void;
};

/** The words of a control that writes: its own, or the ones saying why it cannot. */
function titled(input: EntryActionInput, own?: string): string | undefined {
    return input.blocked === '' ? own : input.blocked;
}

/**
 * The card's controls: the pin, Edit in File, while the entry has no subtask adding its first, and
 * the Show in Files controls, then the controls the collection passes in. A file with no schema has
 * no identity to write by, so its cards carry the file's other lifecycle statuses instead of the
 * first three.
 */
export function entryActions(input: EntryActionInput): CardAction[] {
    if (!input.addressable) {
        const buttons = input.statuses
            .filter((one) => one !== input.status)
            .map((one): CardAction => ({
                id: `status:${one}`,
                label: one,
                title: titled(input),
                disabled: input.blocked !== '',
                onclick: () => input.onstatus(one)
            }));
        return buttons.concat(input.shows, input.extra);
    }
    const rows: CardAction[] = [
        {
            id: 'pin',
            label: input.pinned ? t('collection.unpin') : t('collection.pin_to_top'),
            title: titled(input),
            glyph: t('collection.pin_glyph'),
            active: input.pinned,
            disabled: input.blocked !== '',
            onclick: input.onpin
        },
        {
            id: 'edit',
            label: t('collection.edit_in_file'),
            title: t('collection.edit_in_file_title', input.fileName),
            glyph: t('collection.edit_glyph'),
            onclick: input.onedit
        }
    ];
    if (input.firstSubtask) {
        rows.push({
            id: 'subtask',
            label: t('project.action.add_subtask'),
            title: titled(input, t('project.action.add_subtask_tip')),
            glyph: t('project.action.add_subtask_glyph'),
            active: input.addingSubtask,
            disabled: input.blocked !== '',
            onclick: input.onsubtask
        });
    }
    return rows.concat(input.shows, input.extra);
}
