<script lang="ts">
    // Layer 3, partial of views/Files.svelte. One line of text and two controls, used both for the
    // folder a root is added from and for the name a workspace is saved under. It holds nothing of
    // its own: the value comes in as a prop and every keystroke goes out as a call, so the view owns
    // the draft and a form that closes and reopens shows what the view still holds.

    import Field from '$lib/ui/Field.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        /** The box's own words, already translated by the view. */
        label: string;
        /** The line under the box, already translated. */
        help?: string;
        /** What the confirming control says, already translated. */
        confirm: string;
        value: string;
        /** What the endpoint refused the last attempt with, already translated. */
        note?: string;
        oninput: (value: string) => void;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let {
        label,
        help = '',
        confirm,
        value,
        note = '',
        oninput,
        onconfirm,
        oncancel
    }: Props = $props();
</script>

<div class="form" data-fs-form={label}>
    <Field {label} {help} {note}>
        <TextInput {value} {label} {oninput} />
    </Field>
    <Toolbar label={t('files.toolbar')}>
        <ToolButton label={confirm} glyph="check" onclick={onconfirm} />
        <ToolButton label={t('files.cancel')} glyph="dismiss" onclick={oncancel} />
    </Toolbar>
</div>

<style>
    .form {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 6px 0;
        border-bottom: 1px solid var(--line);
    }
</style>
