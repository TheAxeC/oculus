// Layer 2, client state. Which decks the Present view can open, and the deck a pane shows.
//
// What is held here is where decks are: the portfolio deck (`portfolio_deck` of the merged config,
// a folder of the hub) and the deck of every project that has one (the snapshot's `project.deck`),
// both derived, so a deck added or a project given its first slide reaches the open deck menu on
// the next push. The deck itself is asked of api/deck the first time it is wanted and held in the
// client state's query client by its root and folder.
//
// The deck is read by the server from files and from the portfolio, so three things make a held
// answer stale: a slide file or `present.yml` written under a watched root (the `files` channel), a
// manifest changed, which moves a chip or a name on a card (the `portfolio` channel), and a colour
// or tag tone changed in the configuration (the `config` channel, which carries `defaults`). Each
// new version marks every held deck, and the next read asks again from a tab that is shown while
// what is held keeps drawing, so a slide saved in an editor reaches the open pane at the next push.
// The request carries the page's token, as the search does.
//
// Where a reader is in the deck is not here. It belongs to the pane, in the instance state of
// state/workbench/ui.svelte.ts, so two Present panes hold two positions, a pane is on its slide
// when its page comes back, and the slide a project card opens the deck at is the same key.

import { z } from 'zod';
import { str } from '../../data/helpers/guards.ts';
import { readAs, unchangedAs } from '../../data/shapes/shapes.ts';
import type { Deck } from '../../data/model/index.ts';
import { readAnswer } from '../sources/fs-transport.ts';
import { HUB_ROOT } from '../sources/fs.ts';
import type { EntitiesStore, Queries } from '../shared/stores/shapes.ts';
import type { DeckRef } from './present.ts';

/** One deck as the pane reads it. */
type DeckAnswer = {
    deck: Deck | null;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the deck is yet to come. */
    loading: boolean;
};

/** One project's deck as the deck menu lists it. */
type ProjectDeck = { ref: DeckRef; id: string; title: string };

export type PresentStore = {
    /** The portfolio deck, null when the configuration names none. */
    portfolio: () => DeckRef | null;
    /** The decks of the projects that have one, by title. */
    projectDecks: () => ProjectDeck[];
    /** The deck a reference names, the portfolio deck for the empty one; null when none is set. */
    shown: (ref: DeckRef) => DeckRef | null;
    /** The answer for one deck. */
    deck: (ref: DeckRef) => DeckAnswer;
};

/** What every deck's query key opens with. */
const KIND = 'deck';

/** What a deck reads as until its answer arrives. */
const PENDING: DeckAnswer = { deck: null, error: '', loading: true };

/** What no deck at all reads as: no reference asks nothing and waits for nothing. */
const NOTHING: DeckAnswer = { deck: null, error: '', loading: false };

/** The part of an answer the pane depends on; the slides are the server's own and are kept. */
const deckShape = unchangedAs<Deck>(
    z.object({
        root: z.string(),
        path: z.string(),
        name: z.string(),
        title: z.string(),
        state: z.enum(['ok', 'empty', 'no_file', 'unreadable', 'missing']),
        slides: z.array(z.object({ key: z.string(), kind: z.string(), title: z.string() })),
        groups: z.array(z.object({ name: z.string() })),
        tagTones: z.record(z.string(), z.string()),
        findings: z.array(z.unknown())
    })
);

export function createPresent(
    entities: EntitiesStore,
    queries: Queries,
    token: () => string
): PresentStore {
    const heard: Record<string, number | undefined> = {};

    entities.afterReceive((message) => {
        if (!['files', 'portfolio', 'config'].includes(message.channel)) return;
        if (message.version === heard[message.channel]) return;
        heard[message.channel] = message.version;
        queries.mark([KIND], 'wait');
    });

    /** The deck a reference names. The first call asks the server; what is held keeps showing. */
    function deck(ref: DeckRef): DeckAnswer {
        if (ref.root === '') return NOTHING;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the deck stays pending and the browser asks for it on the first client render.
        const { data } = queries.read([KIND, ref.root, ref.path], () => load(ref), {
            enabled: typeof fetch === 'function'
        });
        return data ?? PENDING;
    }

    async function load(ref: DeckRef): Promise<DeckAnswer> {
        try {
            const query = new URLSearchParams({ root: ref.root, path: ref.path });
            const response = await fetch(`/api/deck?${query.toString()}`, {
                headers: { 'x-oculus-token': token() }
            });
            const answer = await readAnswer(response);
            if (!answer.ok) return { deck: null, error: answer.error, loading: false };
            const held = readAs(deckShape, answer.body);
            return held === null
                ? { deck: null, error: 'deck', loading: false }
                : { deck: held, error: '', loading: false };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { deck: null, error: reason, loading: false };
        }
    }

    const path = $derived(str(entities.config()?.config.portfolio_deck) ?? '');
    const portfolio = $derived<DeckRef | null>(path === '' ? null : { root: HUB_ROOT, path });
    const projectDecks = $derived(
        Object.values(entities.portfolio()?.entities.projects ?? {})
            .flatMap((project) =>
                project.deck === undefined
                    ? []
                    : [
                          {
                              ref: { root: HUB_ROOT, path: project.deck },
                              id: project.id,
                              title:
                                  (project.short ?? '') === ''
                                      ? project.title
                                      : (project.short ?? '')
                          }
                      ]
            )
            .sort((left, right) => left.title.localeCompare(right.title))
    );

    function shown(ref: DeckRef): DeckRef | null {
        return ref.root === '' ? portfolio : ref;
    }

    return {
        portfolio: () => portfolio,
        projectDecks: () => projectDecks,
        shown,
        deck
    };
}
