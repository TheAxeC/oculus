// Layer 3, view helper of Save to Literature, which the Literature search card and the Lit Watch
// card carry: SaveToLiterature.svelte draws it as a control of the search card's meta row, and
// `saveAction` gives it as an action of a record card's menu. The hubs it offers are those that
// could take a new entry of the Literature collection (`hubsTaking` of state/shared/page/hubs.ts):
// a hub holds the collection of the entry of its list that names the `literature` registry, and
// also the one its list leaves to oculus's entry when the file is there. With more than one, Save
// is a menu of them, the primary first, each by its name, and the pick saves the paper there; with
// one, a press saves there at once, primary or not. The save names the hub, so the server writes
// where the card looks. Once any of those hubs' collections holds the paper by the rule the server
// refuses a second copy by, Save reads In Literature and does nothing, so a card offers Save only
// while no hub holds it. A card makes its own with `createLiteratureSave` in its script, so
// nothing is held at module level.

import type { Collection } from '$lib/state/boards/collection';
import type { ClientState } from '$lib/state/client/context';
import { inLiterature, type PaperIds } from '$lib/state/feeds/literature/saved';
import { hubsTaking, keyOf } from '$lib/state/shared/page/hubs';
import { t } from '$lib/state/shared/words/text';
import { refusalWords } from '../../forms/answer-words';
import type { CardAction } from '../card';

/** The paper a save sends and what it is compared by. */
export type LiteratureSaveTarget = {
    /** What the paper is compared by. */
    ids: PaperIds;
    /** The fields the save sends; the server cleans them and makes the key. */
    paper: Record<string, unknown>;
    source: 'search' | 'lit-watch';
};

/** What a save answered: its words, and whether the server refused it. */
type SaveAnswer = { words: string; refused: boolean };

/** What one card's Save holds, read through getters so each stays reactive. */
export type LiteratureSave = {
    /** The Literature collection of each hub that holds one, read to follow each change of them. */
    readonly collections: readonly Collection[];
    /** Whether a hub's Literature collection holds the paper. */
    readonly saved: boolean;
    /** The hubs a save can write to, the primary first. */
    readonly hubs: string[];
    /** Whether a save is under way, during which a press or pick does nothing. */
    readonly saving: boolean;
    /**
     * Save the paper to the hub named, or, with no hub holding Literature, where the server picks;
     * null for a press while a save is under way.
     */
    save: (hub: string | undefined) => Promise<SaveAnswer | null>;
    /** Save as an action of a record card's menu, its answer said through `onsaid`. */
    saveAction: (onsaid: (words: string) => void) => CardAction;
};

/** The Save of one card, from the client and the card's current paper. */
export function createLiteratureSave(
    client: ClientState,
    target: () => LiteratureSaveTarget
): LiteratureSave {
    let saving = $state(false);
    /** The Literature collection of each hub that holds one. */
    const held = $derived(client.selectors.registryCollections('literature'));
    const hubs = $derived(hubsTaking(held, client.fs.primary()));
    const saved = $derived.by(() => {
        const { ids } = target();
        return held.some((one) =>
            inLiterature(
                ids,
                one.entries.map((entry) => entry.fields)
            )
        );
    });

    async function save(hub: string | undefined): Promise<SaveAnswer | null> {
        if (saving) return null;
        saving = true;
        try {
            const { source, paper } = target();
            const answer = await client.writes.saveLiterature(source, paper, hub);
            const refused = refusalWords(answer);
            // The answer's id is the paper's id in the portfolio; its citation key is the key.
            return refused === ''
                ? { words: t('literature.saved', keyOf(answer.id ?? '')), refused: false }
                : { words: refused, refused: true };
        } finally {
            saving = false;
        }
    }

    function saveAction(onsaid: (words: string) => void): CardAction {
        const run = async (hub: string | undefined): Promise<void> => {
            const answer = await save(hub);
            if (answer !== null) onsaid(answer.words);
        };
        if (saved) {
            return {
                id: 'save',
                label: t('literature.in_literature'),
                title: t('literature.in_literature_tip'),
                glyph: 'book',
                disabled: true,
                onclick: () => undefined
            };
        }
        const many = hubs.length > 1;
        return {
            id: 'save',
            label: t('literature.save'),
            title: many ? t('literature.save_hub_tip') : t('literature.save_tip'),
            glyph: 'book',
            turning: saving,
            disabled: saving,
            items: many
                ? hubs.map((hub) => ({
                      id: `save:${hub}`,
                      label: hub,
                      disabled: saving,
                      onclick: () => run(hub)
                  }))
                : undefined,
            onclick: () => run(hubs.at(0))
        };
    }

    return {
        get collections() {
            return held;
        },
        get saved() {
            return saved;
        },
        get hubs() {
            return hubs;
        },
        get saving() {
            return saving;
        },
        save,
        saveAction
    };
}
