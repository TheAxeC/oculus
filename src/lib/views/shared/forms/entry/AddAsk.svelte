<script lang="ts">
    // Layer 3, shared view partial. The box an Add opens: it asks what entry-add.ts says the new
    // entry needs and sends it; with no ask it draws nothing. A refusal of the write is shown above
    // the fields with what was typed kept, so the reader corrects it and answers again; once the
    // write is accepted the page of the new entry is open and the box closes.

    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import type { Ask } from './entry-add';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        ask: Ask | null;
        onclose: () => void;
    };

    let { ask, onclose }: Props = $props();

    /** What the box shows now: the fields as typed, the refusal and a counter that redraws it. */
    let typed = $state<string[] | null>(null);
    let refusal = $state('');
    let round = $state(0);

    const request = $derived(
        ask === null
            ? null
            : {
                  message: ask.message,
                  detail: refusal,
                  fields: ask.fields.map((field, at) => ({
                      ...field,
                      value: typed?.[at] ?? field.value
                  })),
                  verb: t('entry_form.add_verb'),
                  act: (values: string[]) => void send(ask, values)
              }
    );

    async function send(held: Ask, values: string[]): Promise<void> {
        const sentence = await held.submit(values);
        if (sentence === '') {
            onclose();
            return;
        }
        typed = values;
        refusal = sentence;
        round += 1;
    }
</script>

{#if request !== null}
    {#key round}
        <Prompt {request} cancel={t('ui.confirm_cancel')} oncancel={onclose} />
    {/key}
{/if}
