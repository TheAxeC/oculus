<script lang="ts">
    // Layer 3, primitive. One tick. The label beside it is the control's name and its words, so a
    // form row that holds one needs nothing else.
    //
    // A caller that gives `unset` words gets the three-state box of a field that may be absent:
    // `checked` null draws the native box indeterminate with the unset words after the label, and a
    // press goes from unset to on (`onchange(true)`), from on to off (`onchange(false)`) and from
    // off back to unset (`onunset()`). The box draws what `checked` says at every moment, so a
    // press the caller does not take leaves it as it was.

    type Props = {
        /** The state drawn; null is unset and is drawn only when `unset` is given. */
        checked: boolean | null;
        /** The words beside the box, already translated by the view. */
        label: string;
        onchange: (checked: boolean) => void;
        /** The words of the unset state, already translated; given, the box has three states. */
        unset?: string;
        /** A press that ends in the unset state. */
        onunset?: () => void;
    };

    let { checked, label, onchange, unset, onunset }: Props = $props();

    let box: HTMLInputElement | null = $state(null);

    const three = $derived(unset !== undefined);

    /** The box as `checked` says, drawn again whenever the caller's state moves. */
    function draw(): void {
        if (box === null) return;
        box.checked = checked === true;
        box.indeterminate = three && checked === null;
    }

    $effect(draw);

    function pressed(event: Event): void {
        const field = event.currentTarget;
        if (!(field instanceof HTMLInputElement)) return;
        if (!three) {
            onchange(field.checked);
            return;
        }
        if (checked === null) onchange(true);
        else if (checked) onchange(false);
        else onunset?.();
        draw();
    }
</script>

<label class="box">
    <input type="checkbox" checked={checked === true} bind:this={box} onchange={pressed} />
    <span class="words">{label}</span>
    {#if three && checked === null}
        <span class="unset">{unset}</span>
    {/if}
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

    .unset {
        color: var(--muted-txt, var(--muted));
    }
</style>
