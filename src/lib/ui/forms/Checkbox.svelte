<script lang="ts">
    // Layer 3, primitive. One tick. The label beside it is the control's name and its words, so a
    // form row that holds one needs nothing else.

    type Props = {
        checked: boolean;
        /** The words beside the box, already translated by the view. */
        label: string;
        onchange: (checked: boolean) => void;
    };

    let { checked, label, onchange }: Props = $props();

    function toggled(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) onchange(field.checked);
    }
</script>

<label class="box">
    <input type="checkbox" {checked} onchange={toggled} />
    <span class="words">{label}</span>
</label>

<style>
    .box {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
        color: var(--ink-txt, var(--ink));
        cursor: pointer;
    }

    input {
        accent-color: var(--accent);
    }

    input:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
