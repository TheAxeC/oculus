// Layer 4, test helper. The two reads a Transcript tab makes of the transcripts store, made the way
// views/sessions/transcript/Transcript.svelte makes them: its turns read through `turnsFor` from an
// effect, which is what asks for the file and asks again once a hidden tab is shown, and the follow
// effect of state/sessions/transcript.svelte.ts (followTab) over the session's record. Called
// inside an effect root (tests/ui/frame/rooted.svelte.ts), which tears both down.

import {
    followTab,
    type TranscriptsStore
} from '../../../src/lib/state/sessions/transcript.svelte.ts';

/** The session's record as a sessions message hands it, as far as a tab reads it. */
export type TabRecord = {
    id: string;
    lastActivity: string | null;
    agents: { id: string; status: string; ended: string | null }[];
};

/** Make one tab of `agent` over the tab's copy of the store and the record the test hands it. */
export function transcriptTab(
    store: TranscriptsStore,
    agent: string,
    record: () => TabRecord | null
): void {
    const id = $derived(record()?.id ?? '');
    const held = $derived(store.turnsFor(id, agent));
    $effect(() => {
        held.turns.forEach(() => undefined);
    });
    followTab(store.follow, () => ({ id, agent, record: record() }));
}
