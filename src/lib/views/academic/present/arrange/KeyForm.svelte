<script lang="ts">
    // Layer 3, Present partial. The frame of a form of the Overview that sets the deck's keys (the
    // deck's own, DeckForm.svelte, and a group's rule, RuleForm.svelte): the fields it is given,
    // then Apply and Cancel. Apply writes the edits the form's work holds (`createKeyWork` in
    // arrange.svelte.ts) and closes the form once they are written; it is held while the arranging
    // controls are held (`busy` of arrange.svelte.ts) or while there is nothing to write. Cancel
    // closes it with nothing written.
    //
    // Escape closes the form too, before the key reaches the deck, so it never closes the grid
    // while a form is open, unless a control inside took the key for itself (a Select closing its
    // list, a filter box clearing what was typed). In an empty field Escape closes the form before
    // the field sees it, since such a field has nothing to clear and a list's filter box
    // (MultiSelect.svelte) takes every Escape.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { KeyEdit } from '$lib/state/life/arrange';
    import type { KeyWorkOf } from './arrange.svelte';

    type Props = {
        /** The form's accessible name. */
        label: string;
        work: KeyWorkOf;
        /**
         * True while the arranging controls are held, which holds Apply: from a write until its
         * answer, and after a write that changed the file until the next push of the deck or the
         * bound after the answer. A refusal or a failure holds nothing.
         */
        busy: boolean;
        /** Write the edits; resolves true once they are written. */
        onapply: (changes: KeyEdit[]) => Promise<boolean>;
        oncancel: () => void;
        children: Snippet;
        /** A `data-*` attribute that names the form. */
        [attribute: `data-${string}`]: string | boolean | undefined;
    };

    let { label, work, busy, onapply, oncancel, children, ...rest }: Props = $props();

    const changes = $derived(work.changes());

    async function apply(): Promise<void> {
        if (await onapply(changes)) oncancel();
    }

    /** Close the form on Escape, with the key kept from the field and from the deck. */
    function cancelled(event: KeyboardEvent): void {
        event.preventDefault();
        event.stopPropagation();
        oncancel();
    }

    /** Escape closes the form, unless a control inside it took the key for itself. */
    function keydown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && !event.defaultPrevented) cancelled(event);
    }

    /** Escape in an empty field closes the form before the field sees the key. */
    function emptied(event: KeyboardEvent): void {
        const field = event.target;
        if (event.key !== 'Escape' || !(field instanceof HTMLInputElement)) return;
        if (field.value === '') cancelled(event);
    }
</script>

<!-- The form is a group of fields; Escape inside it closes it before it reaches the deck. -->
<div
    class="form"
    role="group"
    aria-label={label}
    {...rest}
    onkeydowncapture={emptied}
    onkeydown={keydown}
>
    {@render children()}
    <div class="line">
        <ToolButton
            label={t('present.form_apply')}
            onclick={() => void apply()}
            disabled={busy || changes.length === 0}
        />
        <ToolButton label={t('present.form_cancel')} onclick={oncancel} />
    </div>
</div>

<style>
    .form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        padding: 4px 6px 8px;
        border-bottom: 1px solid var(--border);
    }

    .line {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }
</style>
