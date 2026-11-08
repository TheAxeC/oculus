// Layer 3, primitive support. The room a card keeps at the end of its title for the controls drawn
// over its top right corner (Card.svelte beside it): the card provides it through Svelte's
// context, and a control that lies over the corner (views/shared/card/record/CardActions.svelte)
// tells it the width it takes there. A control drawn outside a card finds none.

import { getContext, setContext } from 'svelte';

/** The context key of the room a card keeps on its title for the controls drawn over it. */
const ROOM = Symbol('card-room');

/** What a card's controls tell it: the width they take over its title, 0 when none. */
export type CardRoom = { lay: (width: number) => void };

/** Hand the room of one card to the controls drawn inside it. */
export function provideCardRoom(room: CardRoom): void {
    setContext(ROOM, room);
}

/**
 * The card around a control, which keeps room on its title for the width the control lays over
 * it; none outside a card.
 */
export function cardRoom(): CardRoom | undefined {
    return getContext<CardRoom | undefined>(ROOM);
}
