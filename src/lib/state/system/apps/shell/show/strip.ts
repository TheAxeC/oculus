// Layer 2, client state. The entries of a title menu (`editor/title`, `view/title`) as the row of
// actions ui/tabs/ActionStrip.svelte draws: the entries of the group `navigation` are buttons, and
// the others are choices of the More Actions list, a rule between two groups. An action's id is the
// position of its entry in the list the menu answered, which `entryOf` reads back.

import type { MenuOffer } from '../contributions.ts';
import { commandLabel } from '../contributions.ts';
import { appIcon } from './icons.ts';

/** One action of a strip, in the shape the strip draws. */
export type StripItem = {
    id: string;
    label: string;
    glyph?: string;
    picture?: string;
    bar: boolean;
    rule?: boolean;
};

/** The actions of a menu's entries; `picture` gives the address of a file of an app. */
export function stripOf(
    offers: readonly MenuOffer[],
    picture: (app: string, path: string) => string
): StripItem[] {
    let lastMore = '';
    return offers.map((offer, at) => {
        const icon = appIcon(offer.command.icon, (path) => picture(offer.app, path));
        const bar = offer.group === 'navigation';
        const rule = !bar && lastMore !== '' && lastMore !== offer.group;
        if (!bar) lastMore = offer.group;
        return {
            id: String(at),
            label: commandLabel(offer.command),
            bar,
            ...(icon !== null && 'glyph' in icon ? { glyph: icon.glyph } : {}),
            ...(icon !== null && 'picture' in icon ? { picture: icon.picture } : {}),
            ...(rule ? { rule } : {})
        };
    });
}

/** The entry an action of `stripOf` stands for. */
export function entryOf(offers: readonly MenuOffer[], id: string): MenuOffer | undefined {
    return offers[Number(id)];
}

/** One choice of a context menu, in the shape the menu draws. */
export type ChoiceItem = {
    id: string;
    label: string;
    hint?: string;
    disabled?: boolean;
    rule?: boolean;
};

/**
 * The choices of a context menu's entries, a rule above the first of every group after the first.
 * `hint` gives the key bound to a command, and `enabled` whether its `enablement` holds. Given a
 * `prefix`, the choices are appended to a menu of oculus's own: each id starts with the prefix and
 * a colon, and the first has a rule above it.
 */
export function choicesOf(
    offers: readonly MenuOffer[],
    hint: (command: string) => string,
    enabled: (offer: MenuOffer) => boolean,
    prefix = ''
): ChoiceItem[] {
    return offers.map((offer, at) => {
        const key = hint(offer.command.command);
        const apart = at > 0 ? offers[at - 1].group !== offer.group : prefix !== '';
        return {
            id: prefix === '' ? String(at) : `${prefix}:${at}`,
            label: commandLabel(offer.command),
            ...(key === '' ? {} : { hint: key }),
            ...(enabled(offer) ? {} : { disabled: true }),
            ...(apart ? { rule: true } : {})
        };
    });
}

/** The position of the entry a choice id stands for, whether or not it has a prefix. */
export function choiceAt(id: string): string {
    return id.slice(id.lastIndexOf(':') + 1);
}
