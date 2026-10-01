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
        onconfirm: () => void;
        oncancel: () => void;
        /**
         * A line under the message: the branch, the count, whatever names what is being acted on.
         */
        detail?: string;
    };

    let { message, confirm, cancel, onconfirm, oncancel, detail = '' }: Props = $props();

    let yes: HTMLButtonElement | undefined = $state();
</script>

<Modal alert onclose={oncancel} onopen={() => yes?.focus()}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={message}>
            <p class="message">{message}</p>
            {#if detail !== ''}
                <p class="detail">{detail}</p>
            {/if}
            <div class="row">
                <button type="button" class="cancel" onclick={oncancel}>{cancel}</button>
                <button type="button" class="yes" bind:this={yes} onclick={onconfirm}
                    >{confirm}</button
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

    .row button:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
