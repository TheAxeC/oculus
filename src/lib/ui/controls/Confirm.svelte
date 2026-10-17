<script lang="ts">
    // Layer 3, primitive. The one confirm dialog: a message, a confirm and a cancel, on the modal
    // ground ui/frame/Modal.svelte draws as an alert dialog. It holds nothing of its own, not even
    // whether it is asked; a caller draws it while it has something to ask and stops drawing it
    // when the answer has come back.
    //
    // DESIGN.md's decision on git writes is that every write sits behind the token and
    // a confirm, and a confirm that is a second press of the same button is one the hand learns to
    // press twice. So it is a real dialog: modal, focus on the confirm, Escape cancels, Tab stays
    // inside it. A press on the ground behind it cancels too, which is the way out for a pointer.
    // A question raised by something other than the reader (an app's write or outside address)
    // opens with the keyboard on Cancel (`focus`), so a key meant for that app never confirms it.
    // A caller may give a box of its own (`option`, VS Code's "Do not ask me again"), whose state
    // the confirm hands to `onconfirm`, and further buttons (`others`) between Cancel and the
    // confirm, each handing its place in the list to `onother`. A confirm that cannot succeed is
    // drawn disabled (`refused`), with the caller's words for why as the detail, and the keyboard
    // then starts on Cancel.
    // Drawn in a tab, it stays in that tab, and one left open in a tab the pane hides takes the
    // keyboard again when its tab shows; the keyboard comes back to the control it was raised from
    // when it goes, as the ground says.

    import Modal from '../frame/Modal.svelte';

    type Props = {
        /** What is about to happen, in the caller's own words, already translated. */
        message: string;
        /** The confirming control's words, already translated. */
        confirm: string;
        /** The cancelling control's words, already translated. */
        cancel: string;
        onconfirm: (checked: boolean) => void;
        oncancel: () => void;
        /**
         * The words of further buttons, already translated, drawn between Cancel and the confirm.
         */
        others?: readonly string[];
        /** The button of `others` that was pressed, by its place in the list. */
        onother?: (index: number) => void;
        /** The words of a box under the message; none draws no box. */
        option?: string;
        /**
         * A line under the message: the branch, the count, whatever names what is being acted on.
         */
        detail?: string;
        /** Where the dialog stands, as ui/frame/Modal.svelte takes it; `dialog` unless given. */
        level?: 'dialog' | 'tray' | 'palette' | 'sheet';
        /** The control that holds the keyboard when the dialog opens; the confirm unless given. */
        focus?: 'confirm' | 'cancel';
        /** Draw the confirm disabled, for an answer that cannot succeed now. */
        refused?: boolean;
    };

    let {
        message,
        confirm,
        cancel,
        onconfirm,
        oncancel,
        others = [],
        onother,
        detail = '',
        option = '',
        level = 'dialog',
        focus = 'confirm',
        refused = false
    }: Props = $props();

    let yes: HTMLButtonElement | undefined = $state();
    let no: HTMLButtonElement | undefined = $state();
    let checked = $state(false);
</script>

<Modal
    alert
    {level}
    onclose={oncancel}
    onopen={() => (focus === 'cancel' || refused ? no : yes)?.focus()}
>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={message}>
            <p class="message">{message}</p>
            {#if detail !== ''}
                <p class="detail">{detail}</p>
            {/if}
            {#if option !== ''}
                <label class="option"><input type="checkbox" bind:checked />{option}</label>
            {/if}
            <div class="row">
                <button type="button" class="cancel" bind:this={no} onclick={oncancel}
                    >{cancel}</button
                >
                {#each others as other, index (index)}
                    <button type="button" class="other" onclick={() => onother?.(index)}
                        >{other}</button
                    >
                {/each}
                <button
                    type="button"
                    class="yes"
                    bind:this={yes}
                    disabled={refused}
                    onclick={() => onconfirm(checked)}>{confirm}</button
                >
            </div>
        </div>
    {/snippet}
</Modal>

<style>
    .box {
        position: relative;
        max-width: 30rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    /* The box floats over a pane and holds the question, so it keeps more of its colour than the
       pane does. */
    :global(body.wall) .box {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .message {
        margin: 0;
        font-size: var(--fs-md);
    }

    .detail {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        white-space: pre-line;
        overflow-wrap: anywhere;
    }

    .option {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
    }

    .row button {
        padding: 3px 10px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        cursor: pointer;
    }

    .row .yes {
        border-color: var(--accent);
        color: var(--accent-txt, var(--accent));
    }

    .row button:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .row button:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
