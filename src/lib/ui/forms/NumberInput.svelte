<script lang="ts">
    // Layer 3, primitive. A box for a number. It is a text box that asks a touch screen for a
    // decimal keypad, and it holds whatever text is typed: a browser's own number field drops the
    // text it cannot read as a number and shows no reason, while a form around this box can say why
    // a text is not a number and keep the text for the reader to mend. It holds nothing of its own:
    // the text comes in as a prop and goes out as calls, with Enter and the loss of focus as the
    // moments a form writes in, as ui/forms/TextInput.svelte gives them.

    import type { ComponentProps } from 'svelte';
    import TextInput from './TextInput.svelte';

    /** The text box's own props, but for the two that make it a number box or a secret. */
    type Props = Omit<ComponentProps<typeof TextInput>, 'inputmode' | 'secret'>;

    let props: Props = $props();
</script>

<TextInput {...props} inputmode="decimal" />
