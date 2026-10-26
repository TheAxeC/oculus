// Layer 3, view helper of views/shared/forms/entry/AddAsk.svelte. What each Add asks and does: a
// collection's Add asks the entry's identity value (a venue: its name and its id); a lead's asks
// its title; a Lit Watch paper's asks its title, its address and its bucket; Literature's asks a
// DOI or an address. Each writes the entry and opens its page, which names the entry by its hub
// and its key and where the editor fills the rest; a refusal comes back as the server's sentence
// for the box to show above what was typed.
//
// A collection's Add and Literature's Add write to a hub that could take the entry, by the rule
// every path that makes a record reads (`hubsTaking` of state/shared/page/hubs.ts): when more than
// one hub holds the collection, the box asks which, the primary first and chosen; when one hub
// holds it, the entry goes to that hub, primary or not, and nothing is asked.
//
// Literature's Add looks a DOI, an arXiv paper or a PubMed paper up through the sources the
// Literature search asks (state/feeds/literature/lookup.ts) and saves the paper they merge into;
// any other address, or an identifier no source found, is saved as an entry of its address. An
// empty answer turns the box into the collection's own Add, which asks the key.

import type { PromptField } from '$lib/ui/forms/prompt';
import type { ClientState } from '$lib/state/client/context';
import type { Collection, SchemaField } from '$lib/state/boards/collection';
import { pageView } from '$lib/state/forms/page-entry';
import {
    addressOfId,
    bareId,
    hubsTaking,
    keyOf,
    rootOf,
    type RegistryWord
} from '$lib/state/shared/page/hubs';
import { askFields } from '$lib/state/forms/new-entry';
import { radarBuckets } from '$lib/state/feeds/radar';
import { vocabOf } from '$lib/state/shared/words/tones';
import { lookUp, lookupOf, sourceName, sourcesAsked } from '$lib/state/feeds/literature/lookup';
import { hitPaper } from '$lib/state/feeds/literature/saved';
import { t } from '$lib/state/shared/words/text';
import { refusalWords } from '../answer-words';

/** What an Add box asks, and what its yes does with the typed values. */
export type Ask = {
    message: string;
    fields: PromptField[];
    /**
     * Write the entry: the sentence of a refusal, the empty text once the page is open, or another
     * Add for the box to ask in its place.
     */
    submit: (values: string[]) => Promise<string | Ask>;
};

/** Open the page of the entry just added, by its id in the portfolio; its tab shows its key. */
function openPage(
    client: ClientState,
    collection: string,
    id: string,
    registry?: RegistryWord
): void {
    const page = pageView(collection, id, keyOf(id), registry);
    void client.layout.openView(page.view, page.state);
}

/**
 * The hubs that could take a new entry of a collection, given as the collection of each hub that
 * holds one, the primary first, as the choices of Add's hub question: each hub's name, which is
 * what a write names it by.
 */
function hubChoices(client: ClientState, held: Collection[]): { id: string; label: string }[] {
    const hubs = hubsTaking(held, client.fs.primary());
    return hubs.map((name) => ({ id: name, label: name }));
}

/**
 * Which hub an Add writes to: the question the box asks when more than one hub holds the
 * collection (`held`, each hub's), `chosen` chosen when it is one of them and the primary
 * otherwise, the primary first, and the hub a box's typed values name, which is that question's
 * answer, the one hub holding the collection when there is one, and none otherwise.
 */
function hubAsk(
    client: ClientState,
    held: Collection[],
    chosen?: string
): { fields: PromptField[]; rootOf: (answer: string | undefined) => string | undefined } {
    const hubs = hubChoices(client, held);
    if (hubs.length > 1) {
        const value = hubs.some((one) => one.id === chosen) ? (chosen ?? '') : hubs[0].id;
        return {
            fields: [{ label: t('entry_form.add_hub'), value, choices: hubs }],
            rootOf: (answer) => answer
        };
    }
    return { fields: [], rootOf: () => hubs.at(0)?.id };
}

/**
 * The Add of a collection: the identity value of the new entry, the registry key if any, and the
 * hub to write it in when more than one hub holds the collection, `chosen` chosen when it is one of
 * them and the primary otherwise. `held` is the collection of each hub that holds it, those of the
 * key `collection` unless given (a registry's, whose key each hub's list gives); the entry is
 * written under the key of the chosen hub's collection.
 */
export function collectionAsk(
    client: ClientState,
    collection: string,
    schema: SchemaField[] | undefined,
    title: string,
    chosen?: string,
    held: Collection[] = client.selectors.collectionsOfKey(collection)
): Ask {
    const asked = askFields(collection, schema);
    const hub = hubAsk(client, held, chosen);
    /** The key the hub `root` names the collection by, `collection` for none. */
    const keyIn = (root: string | undefined): string => {
        const one = held.find((each) => rootOf(each) === root);
        return one === undefined ? collection : bareId(one);
    };
    return {
        message: t('entry_form.add_ask', title),
        fields: [
            ...asked.map((one) => ({ label: one.label ?? one.field, value: '' })),
            ...hub.fields
        ],
        submit: async (values) => {
            const body = Object.fromEntries(asked.map((one, at) => [one.field, values[at].trim()]));
            const root = hub.rootOf(values.at(asked.length));
            const key = keyIn(root);
            const answer = await client.writes.newEntry(key, body, root);
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) {
                const into = held.find((each) => rootOf(each) === root);
                openPage(client, key, answer.id, into?.registry);
            }
            return sentence;
        }
    };
}

/** The Add of the leads feed: the title of the new lead. */
export function leadAsk(client: ClientState): Ask {
    return {
        message: t('entry_form.add_lead_ask'),
        fields: [{ label: t('entry_form.add_lead_title'), value: '' }],
        submit: async ([title]) => {
            const answer = await client.writes.addLead({ title: title.trim() });
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) openPage(client, 'leads', answer.id);
            return sentence;
        }
    };
}

/**
 * The Add of Lit Watch: the title and the address of the new paper, and its bucket, one of the
 * `radar_buckets` of the hub the paper is written to, the primary, else the first hub.
 */
export function paperAsk(client: ClientState): Ask {
    const hubs = client.fs
        .roots()
        .filter((one) => one.hub === true)
        .map((one) => one.key);
    const home = hubsTaking(hubs, client.fs.primary()).at(0);
    const buckets = radarBuckets(vocabOf(home).radar_buckets).map((one) => ({
        id: one.key,
        label: one.label
    }));
    return {
        message: t('entry_form.add_paper_ask'),
        fields: [
            { label: t('entry_form.add_paper_title'), value: '' },
            { label: t('entry_form.add_paper_url'), value: '' },
            {
                label: t('entry_form.add_paper_bucket'),
                value: buckets.at(0)?.id ?? '',
                choices: buckets
            }
        ],
        submit: async ([title, url, bucket]) => {
            const answer = await client.writes.addRadarEntry({
                title: title.trim(),
                url: url.trim(),
                bucket
            });
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) openPage(client, 'radar', answer.id);
            return sentence;
        }
    };
}

/**
 * The Add of the Literature collection, the one whose entry names the `literature` registry: one
 * value, a DOI or an address, and the hub to save it in when more than one hub holds such a
 * collection, the primary chosen. `plain` is the collection's own Add, which an empty answer turns
 * the box into, given the hub chosen in this box. `held` is the collection of each hub the paper
 * may be saved in, every hub's whose entry names the registry unless given (a joined view's, whose
 * hubs' entries of its key name it). The saved paper's page opens under its hub's key of the
 * registry.
 */
export function literatureAsk(
    client: ClientState,
    plain: (chosen?: string) => Ask,
    held: Collection[] = client.selectors.registryCollections('literature')
): Ask {
    const hub = hubAsk(client, held);
    return {
        message: t('entry_form.add_literature_ask'),
        fields: [{ label: t('entry_form.add_literature_value'), value: '' }, ...hub.fields],
        submit: async ([typed, chosen]) => {
            const text = typed.trim();
            if (text === '') return plain(chosen);
            const lookup = lookupOf(text);
            let paper: Record<string, unknown> = { url: text };
            if (lookup !== null) {
                const token = client.writes.writeToken();
                const found = await lookUp(lookup, await sourcesAsked(token), { token });
                if ('failed' in found) {
                    const names = found.failed.map((one) => sourceName(one)).join(', ');
                    return t('entry_form.add_literature_failed', names);
                }
                if ('paper' in found) paper = hitPaper(found.paper);
                else paper = lookup.by === 'doi' ? { doi: lookup.id } : { url: lookup.url };
            }
            const answer = await client.writes.saveLiterature('hand', paper, hub.rootOf(chosen));
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) {
                const into = addressOfId(answer.id).hub;
                const key = client.selectors.registryKey('literature', into);
                openPage(client, key, answer.id);
            }
            return sentence;
        }
    };
}
