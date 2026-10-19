// Layer 3, view helper of views/shared/card/feed/LeadCard.svelte. A lead's `applied` hand-off,
// which the Leads view and the lead's own page both offer through the card: the Applications file
// opened beside the view the card is drawn in, with an entry filled from the lead
// (state/feeds/lead-application.ts) placed in its unsaved text, and then the lead set to the
// status carrying `lead_applied` in `statuses` of config/catalogs/vocab.yml.
// A lead is named as the feed write names it, by the title as the file holds it. A refused
// placement writes nothing to the lead, and a refused write of the lead leaves the entry in the
// text.

import type { ClientState } from '$lib/state/client/context';
import { appliedWord, type LeadEntry } from '$lib/state/feeds/leads';
import { APPLICATIONS, LEADS_FEED, applicationFromLead } from '$lib/state/feeds/lead-application';
import { asText } from '$lib/state/forms/schema';
import { sourceFileState } from '$lib/state/sessions/source/place';
import { viewSourceFile } from '$lib/state/sessions/view-source';
import { feedRoot } from '$lib/state/shared/page/idents';
import { answerWords } from '../../forms/answer-words';
import { placeInFile } from '../../forms/entry-file';

/**
 * Open Applications beside the view instance `beside` with an entry filled from `entry`, then set
 * the lead to the applied status. Answers the sentence to draw: a refusal's, else the empty text.
 */
export async function applyFromLead(
    client: ClientState,
    entry: LeadEntry,
    beside: string
): Promise<string> {
    const file = viewSourceFile(
        'collection',
        client.selectors.configMap(),
        client.fs.primary(),
        APPLICATIONS
    );
    if (file === null) return '';
    const placed = await placeInFile(
        client,
        file,
        client.selectors.collectionOf(APPLICATIONS)?.schema,
        APPLICATIONS,
        applicationFromLead(entry, client.selectors.configMap()),
        (one) => client.layout.openBeside('source', sourceFileState(client, one), undefined, beside)
    );
    if (!placed.placed) return placed.sentence;
    const lead = asText(entry.title);
    const applied = appliedWord(client.selectors.configMap());
    if (lead === '' || applied === '') return '';
    const answer = await client.writes.writeFeedField(
        LEADS_FEED,
        lead,
        'status',
        applied,
        feedRoot(entry)
    );
    return answer.ok ? '' : answerWords(answer);
}
