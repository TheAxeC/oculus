<script lang="ts">
    // Layer 3, view partial. The inline field a Rename opens on a terminal's row, or on the bar's
    // title while no list is drawn: a text box holding the current title. Enter saves it (an empty
    // value clears the title), Escape or focus leaving the box cancels. It keeps its own draft and
    // hands the saved value out; what the value means is the terminals store's `renameTerminal`.

    import { untrack } from 'svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';

    type Props = {
        /** The title as it stands, which the box starts with. */
        value: string;
        /** The box's accessible name, already translated. */
        label: string;
        onsave: (value: string) => void;
        oncancel: () => void;
    };

    let { value, label, onsave, oncancel }: Props = $props();

    let draft = $state(untrack(() => value));
    let host: HTMLSpanElement | undefined = $state();

    // The box takes the keyboard when it opens, with its text selected as a rename field does.
    $effect(() => {
        const box = host?.querySelector('input');
        if (box === null || box === undefined) return;
        box.focus();
        box.select();
    });

    function keys(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            onsave(draft);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            oncancel();
        }
    }

    function left(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (to instanceof Node && host?.contains(to) === true) return;
        oncancel();
    }
</script>

<!-- The keys reach the box's own input; this span only reads them on their way up. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span class="rename" bind:this={host} onkeydown={keys} onfocusout={left}>
    <TextInput value={draft} {label} oninput={(typed: string) => (draft = typed)} />
</span>

<style>
    .rename {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
    }
</style>
