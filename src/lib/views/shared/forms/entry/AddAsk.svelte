<script lang="ts">
    // Layer 3, shared view partial. The box an Add opens: it asks what entry-add.ts says the new
    // entry needs, a typed line, a pick or a multi-pick per field, and sends what was typed and
    // picked; with no ask it draws nothing. A refusal of the write is shown above the fields with
    // what was typed and picked kept, so the reader corrects it and answers again; once the write
    // is accepted the page of the new entry is open and the box closes. An answer that hands back
    // another Add (Literature's, answered with nothing; a collection's, answered with another hub)
    // asks that one in its place.

    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import type { PickWords } from '$lib/ui/forms/prompt';
    import type { Ask } from './entry-add';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        ask: Ask | null;
        onclose: () => void;
    };

    let { ask, onclose }: Props = $props();

    /** What the box shows now: the fields as typed and picked, the refusal and a redraw counter. */
    let typed = $state<string[] | null>(null);
    let kept = $state<string[][] | null>(null);
    let refusal = $state('');
    let round = $state(0);
    /** The Add an answer handed back, asked in place of the one the box was opened with. */
    let next = $state<Ask | null>(null);

    /** The words a multi-pick of the box draws, those the entry editor's multi-pick draws. */
    const pickWords: PickWords = {
        search: t('editor.search'),
        remove: t('editor.remove'),
        removeGlyph: t('editor.remove_glyph'),
        none: t('editor.no_choices'),
        more: (count: number) => t('editor.more_choices', count)
    };

    const current = $derived(ask === null ? null : (next ?? ask));
    const request = $derived(
        current === null
            ? null
            : {
                  message: current.message,
                  detail: refusal,
                  fields: current.fields.map((field, at) => ({
                      ...field,
                      value: typed?.[at] ?? field.value,
                      ...(field.picked === undefined ? {} : { picked: kept?.[at] ?? field.picked })
                  })),
                  verb: t('entry_form.add_verb'),
                  pickWords,
                  act: (values: string[], picked: string[][]) => void send(current, values, picked)
              }
    );

    function close(): void {
        next = null;
        typed = null;
        kept = null;
        refusal = '';
        onclose();
    }

    async function send(held: Ask, values: string[], picked: string[][]): Promise<void> {
        const answer = await held.submit(values, picked);
        if (answer === '') {
            close();
            return;
        }
        if (typeof answer === 'string') {
            typed = values;
            kept = picked;
            refusal = answer;
        } else {
            next = answer;
            typed = null;
            kept = null;
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
