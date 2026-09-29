<script lang="ts">
    // Layer 3, primitive. One date. The browser's date control only ever holds a full ISO date, and
    // a manifest may hold something else in a date field, so a value that is not one is edited as
    // text instead: showing a picker with nothing in it, over a value the file does hold, would
    // look like the field was empty and would clear it on the next save. The text box carries the
    // text boxes' editing menu (TextBoxMenu.svelte); the date control keeps the browser's.

    import TextBoxMenu from '../controls/text/TextBoxMenu.svelte';
    import { boxValue } from '../controls/text/text-menu';

    type Props = {
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        oninput: (value: string) => void;
    };

    let { value, label, oninput }: Props = $props();

    let box: HTMLInputElement | null = $state(null);

    /** What the browser's date control accepts, and the only thing this writes as a date. */
    const ISO = /^\d{4}-\d{2}-\d{2}$/;

    const kind = $derived(value === '' || ISO.test(value) ? 'date' : 'text');

    function typed(event: Event): void {
        const typedValue = boxValue(event);
        if (typedValue !== null) oninput(typedValue);
    }
</script>

{#if kind === 'date'}
    <input class="date" type="date" {value} aria-label={label} oninput={typed} />
{:else}
    <TextBoxMenu {label} box={() => box}>
        <input
            class="date"
            type="text"
            {value}
            aria-label={label}
            oninput={typed}
            bind:this={box}
        />
    </TextBoxMenu>
{/if}

<style>
    .date {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
    }

    .date:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    :global(body.rice) .date {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }
</style>
