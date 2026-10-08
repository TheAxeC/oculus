<script lang="ts">
    // Layer 3, primitive. One of a list of choices. The choices are values and words the caller
    // resolved; this knows nothing about where they came from.
    //
    // The empty choice is there and first whenever the caller gives its words: a field of the
    // manifest that is set to nothing is a field that is not there, and clearing one is as ordinary
    // as setting it. A caller that gives none draws a pick that always holds one of the choices. A
    // disabled pick is drawn so and carries `title`, the words saying why.

    import { isStray } from './choices';

    type Props = {
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        /** The words of the empty choice, already translated; omitted, there is no empty choice. */
        empty?: string;
        choices: { id: string; label: string }[];
        onchange: (value: string) => void;
        disabled?: boolean;
        /** Why the pick is disabled, already translated. */
        title?: string;
    };

    let { value, label, empty, choices, onchange, disabled = false, title }: Props = $props();

    function picked(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLSelectElement) onchange(field.value);
    }

    /** A value the choices do not hold is still shown, so a manifest is never silently retyped. */
    const stray = $derived(
        isStray(
            value,
            choices.map((choice) => choice.id)
        )
    );
</script>

<select class="select" aria-label={label} {disabled} {title} onchange={picked}>
    {#if empty !== undefined}
        <option value="" selected={value === ''}>{empty}</option>
    {/if}
    {#if stray}
        <option {value} selected>{value}</option>
    {/if}
    {#each choices as choice (choice.id)}
        <option value={choice.id} selected={choice.id === value}>{choice.label}</option>
    {/each}
</select>

<style>
    .select {
        max-width: 100%;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-md);
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        padding: 4px 6px;
    }

    .select:disabled {
        color: var(--muted-txt, var(--muted));
        cursor: not-allowed;
    }

    .select:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    :global(body.rice) .select {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }
</style>
