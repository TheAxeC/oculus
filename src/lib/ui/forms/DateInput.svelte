<script lang="ts">
    // Layer 3, primitive. One date. The browser's date control only ever holds a full ISO date, and
    // a manifest may hold something else in a date field, so a value that is not one is edited as
    // text instead: showing a picker with nothing in it, over a value the file does hold, would
    // look like the field was empty and would clear it on the next save. The text box carries the
    // text boxes' editing menu (TextBoxMenu.svelte); the date control keeps the browser's.
    //
    // A form that writes the value when the reader is done with the box hands `onsettle`, called
    // with the box's text on Enter and when the box loses the focus; the box keeps nothing of its
    // own. A disabled box is drawn so and carries `title`, the words saying why.

    import TextBoxMenu from '../controls/text/TextBoxMenu.svelte';
    import { typedInto } from '../controls/text/text-menu';
    import '../theme/field.css';

    type Props = {
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        oninput?: (value: string) => void;
        /** The reader is done with the box: Enter was pressed or the focus left, with its text. */
        onsettle?: (value: string) => void;
        disabled?: boolean;
        /** Why the box is disabled, already translated. */
        title?: string;
    };

    let { value, label, oninput, onsettle, disabled = false, title }: Props = $props();

    function typed(event: Event): void {
        typedInto(event, (next) => oninput?.(next));
    }

    function settled(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) onsettle?.(field.value);
    }

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.isComposing) settled(event);
    }

    let box: HTMLInputElement | null = $state(null);

    /** What the browser's date control accepts, and the only thing this writes as a date. */
    const ISO = /^\d{4}-\d{2}-\d{2}$/;

    const kind = $derived(value === '' || ISO.test(value) ? 'date' : 'text');
</script>

{#if kind === 'date'}
    <input
        class="oculus-field"
        type="date"
        {value}
        aria-label={label}
        {disabled}
        {title}
        oninput={typed}
        onkeydown={keyed}
        onblur={settled}
    />
{:else}
    <TextBoxMenu {label} box={() => box}>
        <input
            class="oculus-field"
            type="text"
            {value}
            aria-label={label}
            {disabled}
            {title}
            oninput={typed}
            onkeydown={keyed}
            onblur={settled}
            bind:this={box}
        />
    </TextBoxMenu>
{/if}
