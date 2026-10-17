<script lang="ts">
    // Layer 3, primitive. One of a list of choices. The choices are values and words the caller
    // resolved; this knows nothing about where they came from.
    //
    // The empty choice is there and first whenever the caller gives its words: a field of the
    // manifest that is set to nothing is a field that is not there, and clearing one is as ordinary
    // as setting it. A caller that gives none draws a pick that always holds one of the choices. A
    // disabled pick is drawn so and carries `title`, the words saying why. A choice given a group
    // is drawn under it as an `<optgroup>`, after the choices given none.
    //
    // The pick is the browser's own select with its own mark taken off and the `disclosure` glyph
    // drawn at its right end in its place, the mark select/FieldSelect.svelte's trigger draws, so
    // two dropdowns side by side carry one mark in every theme, a terminal theme's `v` among them.

    import { choiceGroups, isStray, type SelectChoice } from './choices';
    import Glyph from '../../display/Glyph.svelte';
    import '../../theme/field.css';

    type Props = {
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        /** The words of the empty choice, already translated; omitted, there is no empty choice. */
        empty?: string;
        choices: SelectChoice[];
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

    const drawn = $derived(choiceGroups(choices));
</script>

<span class="pick">
    <select class="select oculus-field" aria-label={label} {disabled} {title} onchange={picked}>
        {#if empty !== undefined}
            <option value="" selected={value === ''}>{empty}</option>
        {/if}
        {#if stray}
            <option {value} selected>{value}</option>
        {/if}
        {#each drawn.loose as choice (choice.id)}
            <option value={choice.id} selected={choice.id === value}>{choice.label}</option>
        {/each}
        {#each drawn.groups as group (group.name)}
            <optgroup label={group.name}>
                {#each group.choices as choice (choice.id)}
                    <option value={choice.id} selected={choice.id === value}>{choice.label}</option>
                {/each}
            </optgroup>
        {/each}
    </select>
    <span class="caret"><Glyph name="disclosure" /></span>
</span>

<style>
    .pick {
        position: relative;
        display: inline-flex;
        min-width: 0;
        max-width: 100%;
    }

    /* The browser's mark is taken off, and the room it took is the glyph's. */
    .select {
        appearance: none;
        min-width: 0;
        max-width: 100%;
        padding-right: calc(12px + var(--icon-box) * var(--text-scale, 1));
    }

    /* Over the select's right end, where the browser's mark was; a press on it is the select's. */
    .caret {
        position: absolute;
        top: 0;
        right: 6px;
        bottom: 0;
        display: inline-flex;
        align-items: center;
        pointer-events: none;
        color: var(--muted-txt, var(--muted));
    }
</style>
