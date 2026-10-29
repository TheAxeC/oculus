<script lang="ts">
    // Layer 3, view part. The choice of a data file's primary key that a row of the Findings view
    // offers for a file that has none (state/boards/collection/key-choice.ts): a pick of the fields
    // the file may be keyed by and the button that writes it. The write is one row of History, or
    // two when the file's `collections:` entry loses the key it named beside the schema; the
    // finding goes once the hub is read again. A refusal is shown under the pick as its sentence.

    import Select from '$lib/ui/forms/choice/Select.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { writeKeyChoice, type KeyChoice } from '$lib/state/boards/collection/key-choice';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { writes } = useState();

    let { choice }: { choice: KeyChoice } = $props();

    /** The field picked, the write in flight, and the sentence of a refusal. */
    let field = $state('');
    let busy = $state(false);
    let refused = $state('');

    const choices = $derived(choice.fields.map((one) => ({ id: one, label: one })));

    async function set(): Promise<void> {
        if (field === '' || busy) return;
        busy = true;
        refused = (await writeKeyChoice(writes, choice, field)) ?? '';
        busy = false;
    }
</script>

<div class="choice" data-key-choice={choice.collection} title={t('views.findings_key_help')}>
    <Select
        value={field}
        label={t('views.findings_key_pick')}
        empty={t('views.findings_key_none')}
        {choices}
        onchange={(next: string) => (field = next)}
        disabled={busy}
    />
    <ToolButton
        label={t('views.findings_key_set')}
        onclick={set}
        disabled={field === '' || busy}
        waiting={busy}
    />
    {#if refused !== ''}
        <span class="refused" role="alert">{refused}</span>
    {/if}
</div>

<style>
    .choice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 6px;
        flex-basis: 100%;
        min-width: 0;
        padding: 2px 0 4px;
    }

    .refused {
        min-width: 0;
        color: var(--c-amber-txt);
        overflow-wrap: anywhere;
    }
</style>
