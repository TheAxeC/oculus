// Layer 3, view helper of views/shared/forms/entry/AddAsk.svelte. What each Add asks and does: a
// collection's Add asks the entry's identity value (a venue: its name and its id), a lead's asks
// its title, and a Lit Watch paper's asks its title, its address and its bucket. Each writes the
// entry to the primary hub (else the first) and opens its page, where the editor fills the rest; a
// refusal comes back as the server's sentence for the box to show above what was typed.

import type { PromptField } from '$lib/ui/forms/prompt';
import type { ClientState } from '$lib/state/client/context';
import type { SchemaField } from '$lib/state/boards/collection';
import { pageView } from '$lib/state/forms/page-entry';
import { askFields } from '$lib/state/forms/new-entry';
import { radarBuckets } from '$lib/state/feeds/radar';
import { t } from '$lib/state/shared/words/text';
import { refusalWords } from '../answer-words';

/** What an Add box asks, and what its yes does with the typed values. */
export type Ask = {
    message: string;
    fields: PromptField[];
    /** Write the entry; the sentence of a refusal, and the empty text once the page is open. */
    submit: (values: string[]) => Promise<string>;
};

/** Open the page of the entry just added. */
function openPage(client: ClientState, collection: string, key: string): void {
    const page = pageView(collection, key, key);
    void client.layout.openView(page.view, page.state);
}

/** The Add of a collection: the identity value of the new entry, and the registry key if any. */
export function collectionAsk(
    client: ClientState,
    collection: string,
    schema: SchemaField[] | undefined,
    title: string
): Ask {
    const asked = askFields(collection, schema);
    return {
        message: t('entry_form.add_ask', title),
        fields: asked.map((one) => ({ label: one.label ?? one.field, value: '' })),
        submit: async (values) => {
            const body = Object.fromEntries(asked.map((one, at) => [one.field, values[at].trim()]));
            const answer = await client.writes.newEntry(collection, body);
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) {
                openPage(client, collection, answer.id);
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
            if (sentence === '') {
                openPage(client, 'leads', title.trim());
            }
            return sentence;
        }
    };
}

/** The Add of Lit Watch: the title and the address of the new paper, and its bucket. */
export function paperAsk(client: ClientState): Ask {
    const buckets = radarBuckets(client.entities.config()?.config.radar_buckets).map((one) => ({
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
            if (sentence === '') {
                openPage(client, 'radar', title.trim());
            }
            return sentence;
        }
    };
}
