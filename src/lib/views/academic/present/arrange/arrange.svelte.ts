// Layer 3, view helper. The acts that arrange one Present pane's deck in its Overview: a drag of a
// tile or a header and its drop, Move Earlier and Move Later, Remove from Group, Add, and the
// deck's and a group's keys. Each act writes at once through `writeDeckSlides` with the lists the
// deck holds now as its bases (state/life/arrange.ts computes the lists), says what it came to in
// the pane's status line, and is undone from History like any other write.
//
// It also holds what the Overview's two forms share: the work a form does on the deck's keys
// (`createKeyWork`), and whether a form is open under the control that opens it (`createOpener`).
//
// From a write until its answer every arranging control is held (`busy`). After an answer that
// changed the file they stay held until the server sends the files deck again, seen as a new deck
// object, or for `HOLD_MS` after the answer, whichever comes first, so the next act is built on
// the lists the last one wrote rather than refused for bases that moved. The deck read is the
// files deck, never the deck drawn from a source tab's unsaved text. The query store keeps the
// object it holds when an answer is equal to it, so a push that changes nothing brings no new
// object and the bound ends the hold. A refusal or a failure writes nothing and holds nothing.
//
// A drag carries a type only this pane's Overview gives its drags, so a drag from another pane,
// another tab or outside the page is no drop here. It is called while the view is being
// initialised, since it registers its effect there.

import { tick } from 'svelte';
import {
    arrangeLine,
    arrangeWrote,
    deckDropped,
    deckStepped,
    entryDropped,
    entryStepped,
    keyChanges,
    keyShown,
    withKey,
    withTick,
    type DeckKeys,
    type GroupList,
    type KeyEdit,
    type KeyWork,
    type Side
} from '$lib/state/life/arrange';
import { deckFile, deckWords, type Deck, type DeckRef } from '$lib/state/life/present';
import type { WritesStore } from '$lib/state/shared/stores/shapes';
import { t } from '$lib/state/shared/words/text';
import type { ArrangeAct } from '../acts/menu';

/** What the arranging reads from the pane it arranges for. */
type Reads = {
    ref: () => DeckRef | null;
    /** The deck on screen, whose lists an act is made over. */
    deck: () => Deck | null;
    /** The deck as the server read it from its files, which a hold waits on. */
    files: () => Deck | null;
    write: WritesStore['writeDeckSlides'];
    /** Say a line in the pane's status line. */
    say: (line: string) => void;
};

/** What a drag in the Overview carries: an entry of `order:` by its token, or a member deck. */
type Carried = { kind: 'entry'; token: string } | { kind: 'deck'; group: string; name: string };

/** The type every drag of an Overview carries, made this pane's own by a suffix. */
const DRAG_TYPE = 'application/x-oculus-arrange';

/** Which way a target is halved to tell a drop before it from one after it. */
type Axis = 'across' | 'down';

/** The side of the target a drop lands on, by the half of it under the pointer. */
function sideOf(event: DragEvent, axis: Axis): Side {
    const target = event.currentTarget;
    if (!(target instanceof Element)) return 'after';
    const box = target.getBoundingClientRect();
    const half = axis === 'across' ? box.left + box.width / 2 : box.top + box.height / 2;
    return (axis === 'across' ? event.clientX : event.clientY) < half ? 'before' : 'after';
}

/** The longest the controls stay held after an answer that changed the file, in milliseconds. */
const HOLD_MS = 3000;

export function createArrange(reads: Reads) {
    let sending = $state(false);
    /** Whether an answer that changed the file waits for the files deck the server sends next. */
    let waiting = $state(false);
    /** The files deck held when that answer came, which the next one is told from. */
    let over: Deck | null = null;
    let bound: ReturnType<typeof setTimeout> | undefined;
    let carried: Carried | null = null;
    const mine = `${DRAG_TYPE}.${Math.random().toString(36).slice(2)}`;

    function release(): void {
        clearTimeout(bound);
        waiting = false;
    }

    $effect(() => {
        const now = reads.files();
        if (waiting && now !== over) release();
    });
    $effect(() => () => clearTimeout(bound));

    function busy(): boolean {
        return sending || waiting;
    }

    /** The deck when it can be arranged: it was read from its file and no write is in flight. */
    function arrangeable(): Deck | null {
        const deck = reads.deck();
        if (deck === null || busy()) return null;
        return deck.keys === null ? null : deck;
    }

    /** Write one change and say what it came to; true when it wrote. */
    async function send(
        change: { groups?: GroupList[]; order?: { base: string[]; entries: string[] } },
        keys: KeyEdit[],
        said: string
    ): Promise<boolean> {
        const ref = reads.ref();
        const deck = arrangeable();
        if (ref === null || deck === null) return false;
        sending = true;
        const target = { root: ref.root, path: deckFile(ref) };
        const answer = await reads.write(target, change.groups ?? [], change.order, keys);
        sending = false;
        reads.say(arrangeLine(answer, said));
        if (!arrangeWrote(answer)) return answer.ok && answer.refused.length === 0;
        over = reads.files();
        waiting = true;
        bound = setTimeout(release, HOLD_MS);
        return true;
    }

    function group(deck: Deck, name: string) {
        return deck.groups.find((one) => one.name === name) ?? null;
    }

    /** The words a deck of a group is named by in the status line. */
    function deckSaid(deck: Deck, from: string, name: string): string {
        const member = group(deck, from)?.members.find((one) => one.name === name);
        return member === undefined ? name : deckWords(member.title, name);
    }

    /** The words an entry of the order is named by in the status line. */
    function entrySaid(deck: Deck, token: string): string {
        return deck.order.find((one) => one.token === token)?.title ?? token;
    }

    function writeOrder(deck: Deck, token: string, next: string[] | null): void {
        if (next === null) return;
        const base = deck.order.map((one) => one.token);
        const said = t('present.said_entry_moved', entrySaid(deck, token));
        void send({ order: { base, entries: next } }, [], said);
    }

    /** Drop the entry `token` on a side of the entry `onto`. */
    function moveEntry(token: string, onto: string, side: Side): void {
        const deck = arrangeable();
        if (deck === null) return;
        writeOrder(
            deck,
            token,
            entryDropped(
                deck.order.map((one) => one.token),
                token,
                onto,
                side
            )
        );
    }

    /** Move the entry `token` one place earlier or later in the order. */
    function stepEntry(token: string, by: -1 | 1): void {
        const deck = arrangeable();
        if (deck === null) return;
        writeOrder(
            deck,
            token,
            entryStepped(
                deck.order.map((one) => one.token),
                token,
                by
            )
        );
    }

    /** Drop the deck `name` of the group `from` on a side of `onto` in the group `into`. */
    function moveDeck(from: string, name: string, into: string, onto: string | null, side: Side) {
        const deck = arrangeable();
        const leaving = deck === null ? null : group(deck, from);
        const joining = deck === null ? null : group(deck, into);
        if (deck === null || leaving === null || joining === null) return;
        const drop = deckDropped(leaving, joining, name, onto, side);
        const words = deckSaid(deck, from, name);
        if (drop === null) return;
        if ('already' in drop) {
            reads.say(t('present.arrange_already_in', words, into));
            return;
        }
        const said =
            from === into
                ? t('present.said_deck_moved', words, into)
                : t('present.said_deck_joined', words, into);
        void send({ groups: drop.lists }, [], said);
    }

    /** Write one group's new list, with the line it says. */
    function writeGroup(name: string, next: (slides: string[]) => string[] | null, said: string) {
        const deck = arrangeable();
        const held = deck === null ? null : group(deck, name);
        if (held === null) return;
        const slides = next(held.slides);
        if (slides === null) return;
        void send({ groups: [{ group: name, base: held.slides, slides }] }, [], said);
    }

    /** Move a deck one place earlier or later among the decks its group draws. */
    function stepDeck(name: string, deck: string, by: -1 | 1): void {
        const read = arrangeable();
        const held = read === null ? null : group(read, name);
        if (read === null || held === null) return;
        const said = t('present.said_deck_moved', deckSaid(read, name, deck), name);
        writeGroup(name, () => deckStepped(held, deck, by), said);
    }

    /** Take a deck out of its group's `slides:`. */
    function removeDeck(name: string, deck: string): void {
        const read = reads.deck();
        if (read === null) return;
        const said = t('present.said_deck_removed', deckSaid(read, name, deck), name);
        writeGroup(name, (slides) => withTick(slides, deck, false), said);
    }

    /** Add a deck at the end of a group's `slides:`, named by the words its menu showed it with. */
    function addDeck(name: string, deck: string, words: string): void {
        writeGroup(
            name,
            (slides) => withTick(slides, deck, true),
            t('present.said_deck_added', words, name)
        );
    }

    /** Write the keys a form changed; true when they were written. */
    function setKeys(keys: KeyEdit[], said: string): Promise<boolean> {
        return keys.length === 0 ? Promise.resolve(true) : send({}, keys, said);
    }

    /** Run an arranging act a menu picked for an entry of the order. */
    function pickEntry(act: ArrangeAct, token: string): void {
        if (act === 'arrange-earlier') stepEntry(token, -1);
        if (act === 'arrange-later') stepEntry(token, 1);
    }

    /** Run an arranging act a menu picked for a deck of a group. */
    function pickDeck(act: ArrangeAct, name: string, deck: string): void {
        if (act === 'arrange-earlier') stepDeck(name, deck, -1);
        if (act === 'arrange-later') stepDeck(name, deck, 1);
        if (act === 'arrange-remove') removeDeck(name, deck);
    }

    /** Whether the drag over a target is one this Overview started. */
    function ours(event: DragEvent): boolean {
        return carried !== null && (event.dataTransfer?.types ?? []).includes(mine);
    }

    /** Take the drop the pointer is over, so the browser shows a move. */
    function take(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
    }

    /** What is carried, taken out of the drag as it drops. */
    function dropped(event: DragEvent): Carried | null {
        if (!ours(event)) return null;
        const what = carried;
        carried = null;
        event.preventDefault();
        return what;
    }

    return {
        busy,
        pickEntry,
        pickDeck,
        addDeck,
        setKeys,
        /**
         * Start a drag of an entry or of a member deck; nothing starts while a write is held. The
         * drag's start, and its end below, stop at the element dragged, so a group around a tile
         * never takes a tile's drag for its own.
         */
        start(event: DragEvent, what: Carried): void {
            event.stopPropagation();
            if (arrangeable() === null || event.dataTransfer === null) {
                event.preventDefault();
                return;
            }
            carried = what;
            event.dataTransfer.setData(mine, '');
            event.dataTransfer.effectAllowed = 'move';
        },
        end(event: DragEvent): void {
            event.stopPropagation();
            carried = null;
        },
        /** Over a tile of an entry of the order, which takes an entry dropped across it. */
        overEntry(event: DragEvent, token: string): void {
            if (ours(event) && carried?.kind === 'entry' && carried.token !== token) take(event);
        },
        dropOnEntry(event: DragEvent, token: string): void {
            if (carried?.kind !== 'entry') return;
            const what = dropped(event);
            if (what?.kind === 'entry') moveEntry(what.token, token, sideOf(event, 'across'));
        },
        /**
         * Over a group's place, its header or its tiles: an entry goes before or after the entry
         * the group is headed at, and a member deck joins the group at its end.
         */
        overGroup(event: DragEvent, token: string | null): void {
            if (!ours(event) || carried === null) return;
            if (carried.kind === 'deck' || (token !== null && carried.token !== token)) take(event);
        },
        dropOnGroup(event: DragEvent, name: string, token: string | null): void {
            const what = dropped(event);
            if (what?.kind === 'entry' && token !== null) {
                moveEntry(what.token, token, sideOf(event, 'down'));
            }
            if (what?.kind === 'deck') moveDeck(what.group, what.name, name, null, 'after');
        },
        /** Over a tile of a member deck, which takes a member deck dropped across it. */
        overDeck(event: DragEvent): void {
            if (!ours(event) || carried?.kind !== 'deck') return;
            event.stopPropagation();
            take(event);
        },
        dropOnDeck(event: DragEvent, name: string, deck: string): void {
            if (carried?.kind !== 'deck') return;
            event.stopPropagation();
            const what = dropped(event);
            if (what?.kind === 'deck') {
                moveDeck(what.group, what.name, name, deck, sideOf(event, 'across'));
            }
        }
    };
}

export type Arrange = ReturnType<typeof createArrange>;

/**
 * A form's work on the deck's keys, held until Apply: the value it shows for a key (its work, else
 * what the file holds), a key set, and the edits to write, each with the file's value as its base.
 */
export function createKeyWork(keys: () => DeckKeys | null) {
    let work = $state<KeyWork>({});
    return {
        shown: (path: readonly string[]): unknown => keyShown(keys(), work, path),
        onset: (path: string[], value: unknown): void => {
            work = withKey(keys(), work, path, value);
        },
        changes: (): KeyEdit[] => keyChanges(keys(), work)
    };
}

export type KeyWorkOf = ReturnType<typeof createKeyWork>;

/** Whether a form is open under the control that opens it, and the box that holds that control. */
type Opener = {
    box: HTMLElement | null;
    open: () => boolean;
    toggle: () => void;
    /** Close the form and give the keyboard back to the control that opened it. */
    close: () => Promise<void>;
};

export function createOpener(): Opener {
    let open = $state(false);
    const opener: Opener = {
        box: null,
        open: () => open,
        toggle: () => {
            open = !open;
        },
        async close() {
            open = false;
            await tick();
            opener.box?.querySelector('button')?.focus();
        }
    };
    return opener;
}
