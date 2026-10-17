<script lang="ts">
    // Layer 3, primitive. A box for a number. It is a text box that asks a touch screen for a
    // decimal keypad, and it holds whatever text is typed: a browser's own number field drops the
    // text it cannot read as a number and shows no reason, while a form around this box can say why
    // a text is not a number and keep the text for the reader to mend. It holds nothing of its own:
    // the text comes in as a prop and goes out as calls, with Enter and the loss of focus as the
    // moments a form writes in, as ui/forms/TextInput.svelte gives them.
    //
    // A caller that knows why the text in the box is refused hands the words as `refused`: the box
    // then carries `aria-invalid` and the words as its title, the words are drawn beside the box,
    // so a reader who does not hover it sees why it is red, and Enter and the loss of focus hand
    // nothing on until the text is mended. Which texts are refused is the caller's rule, so the box
    // holds no reading of a number of its own; a text with no refusal passes, as it does without
    // the prop.

    import type { ComponentProps } from 'svelte';
    import TextInput from './TextInput.svelte';

    /** The text box's own props, but for the two that make it a number box or a secret. */
    type Own = Omit<
        ComponentProps<typeof TextInput>,
        'inputmode' | 'secret' | 'onenter' | 'onblur' | 'input' | 'value'
    >;

    type Props = Own & {
        /** The text in the box. */
        value: string;
        /** Why the text is refused, already translated; the box's title while it is. */
        refused?: string;
        /** Enter was pressed in the box, with its text. */
        onenter?: (value: string) => void;
        /** The box lost the focus, with its text. */
        onblur?: (value: string) => void;
    };

    let { value, refused, onenter, onblur, ...props }: Props = $props();

    const broken = $derived(refused !== undefined);

    function enter(text: string): void {
        if (!broken) onenter?.(text);
    }

    function leave(text: string): void {
        if (!broken) onblur?.(text);
    }
</script>

<span class="number">
    <span class="box" class:broken>
        <TextInput
            {...props}
            {value}
            inputmode="decimal"
            invalid={refused}
            onenter={enter}
            onblur={leave}
        />
    </span>
    {#if refused !== undefined}
        <span class="refused" role="status">{refused}</span>
    {/if}
</span>

<style>
    /* The box takes the width it is given; the words wrap under it when the row has no room. */
    .number {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 6px;
    }

    .box {
        display: block;
        flex: 1 1 8em;
        min-width: 0;
        border-radius: var(--input-radius);
    }

    .box.broken {
        outline: 1px solid var(--c-red-txt);
    }

    .refused {
        flex: 0 1 auto;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
