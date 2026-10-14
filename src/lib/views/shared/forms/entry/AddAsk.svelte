<script lang="ts">
    // Layer 3, shared view partial. The box an Add opens: it asks what entry-add.ts says the new
    // entry needs and sends it; with no ask it draws nothing. A refusal of the write is shown above
    // the fields with what was typed kept, so the reader corrects it and answers again; once the
    // write is accepted the page of the new entry is open and the box closes. An answer that hands
    // back another Add (Literature's, answered with nothing) asks that one in its place.

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
    /** The Add an answer handed back, asked in place of the one the box was opened with. */
    let next = $state<Ask | null>(null);

    const current = $derived(ask === null ? null : (next ?? ask));
    const request = $derived(
        current === null
            ? null
            : {
                  message: current.message,
                  detail: refusal,
                  fields: current.fields.map((field, at) => ({
                      ...field,
                      value: typed?.[at] ?? field.value
                  })),
                  verb: t('entry_form.add_verb'),
                  act: (values: string[]) => void send(current, values)
              }
    );

    function close(): void {
        next = null;
        typed = null;
        refusal = '';
        onclose();
    }

    async function send(held: Ask, values: string[]): Promise<void> {
        const answer = await held.submit(values);
        if (answer === '') {
            close();
            return;
        }
        if (typeof answer === 'string') {
            typed = values;
            refusal = answer;
        } else {
            next = answer;
            typed = null;
            refusal = '';
        }
        round += 1;
    }
</script>

{#if request !== null}
    {#key round}
        <Prompt {request} cancel={t('ui.confirm_cancel')} oncancel={close} />
    {/key}
{/if}
