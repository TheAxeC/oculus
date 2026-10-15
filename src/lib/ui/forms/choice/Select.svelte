<script lang="ts">
    // Layer 3, primitive. One of a list of choices. The choices are values and words the caller
    // resolved; this knows nothing about where they came from.
    //
    // The empty choice is there and first whenever the caller gives its words: a field of the
    // manifest that is set to nothing is a field that is not there, and clearing one is as ordinary
    // as setting it. A caller that gives none draws a pick that always holds one of the choices. A
    // disabled pick is drawn so and carries `title`, the words saying why. A choice given a group
    // is drawn under it as an `<optgroup>`, after the choices given none.

    import { choiceGroups, isStray, type SelectChoice } from './choices';
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

<style>
    .select {
        max-width: 100%;
    }
</style>
