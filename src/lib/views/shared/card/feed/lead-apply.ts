// Layer 3, view helper of views/shared/card/feed/LeadCard.svelte. A lead's `applied` hand-off,
// which the Leads view and the lead's own page both offer through the card: the Applications file
// of a hub, the file of its collection flagged `lead_applications`, opened beside the view the card
// is drawn in, with an entry filled from the lead (state/feeds/lead-application.ts) placed in its
// unsaved text, and then the lead set to the one status carrying `lead_applied` in `lead_statuses`
// of the lead's own hub. The entry's status is the one word carrying `default_application` in
// `statuses` of the hub that takes it, and none when no word or more than one carries it. The hubs
// it offers are those that could take a new entry of Applications (`hubsTaking` of
// state/shared/page/hubs.ts): with more than one, the card asks which by a menu from the control,
// the primary first; with one, it opens that hub's file, primary or not. The file is the hub's own
// (`Collection.file` under that hub's root, the primary's as the configuration names it), and the
// entry is placed by that hub's schema. A lead is named as the feed write names it, by the title as
// the file holds it. A refused placement writes nothing to the lead, and a refused write of the
// lead leaves the entry in the text.

import type { ClientState } from '$lib/state/client/context';
import { appliedWord, type LeadEntry } from '$lib/state/feeds/leads';
import { LEADS_FEED, applicationFromLead } from '$lib/state/feeds/lead-application';
import { sourceFileState } from '$lib/state/sessions/source/place';
import { viewSourceFile } from '$lib/state/sessions/view-source';
import { bareId, fileUnder, hubsTaking, rootOf } from '$lib/state/shared/page/hubs';
import { feedEntryId, feedRoot } from '$lib/state/shared/page/idents';
import { vocabOf } from '$lib/state/shared/words/tones';
import { t } from '$lib/state/shared/words/text';
import { answerWords } from '../../forms/answer-words';
import { placeInFile } from '../../forms/entry-file';

/**
 * The hubs whose Applications file the portfolio holds, the collection flagged
 * `lead_applications`, the primary first.
 */
export function applyHubs(client: ClientState): string[] {
    return hubsTaking(
        client.selectors.flaggedCollections('lead_applications'),
        client.fs.primary()
    );
}

/**
 * Open the Applications file of the hub `hub` beside the view instance `beside` with an entry
 * filled from `entry`, then set the lead to the applied status. Answers the sentence to draw: a
 * refusal's, the sentence that `hub` holds no Applications when another hub holds one, the
 * sentence that no hub holds Applications when none does, else the empty text.
 */
export async function applyFromLead(
    client: ClientState,
    entry: LeadEntry,
    beside: string,
    hub: string
): Promise<string> {
    const { configMap, flaggedCollections } = client.selectors;
    const primary = client.fs.primary();
    const holders = flaggedCollections('lead_applications');
    const held = holders.find((one) => rootOf(one) === hub);
    if (held === undefined) {
        return holders.length === 0
            ? t('leads.action.no_applications')
            : t('leads.action.hub_no_applications', hub);
    }
    const key = bareId(held);
    const file =
        hub === primary
            ? viewSourceFile('collection', configMap(), primary, key)
            : fileUnder(held.file, client.fs.roots(), primary);
    if (file === null) return '';
    const placed = await placeInFile(
        client,
        file,
        held.schema,
        key,
        applicationFromLead(entry, vocabOf(hub)),
        (one) => client.layout.openBeside('source', sourceFileState(client, one), undefined, beside)
    );
    if (!placed.placed) return placed.sentence;
    const lead = feedEntryId(entry);
    const applied = appliedWord(vocabOf(feedRoot(entry)));
    if (lead === '' || applied === '') return '';
    const answer = await client.writes.writeFeedField(LEADS_FEED, lead, 'status', applied);
    return answer.ok ? '' : answerWords(answer);
}
