<script lang="ts">
    // Layer 3, primitive. The one confirm dialog: a message, a confirm and a cancel. It holds
    // nothing of its own, not even whether it is open; a caller draws it while it has something to
    // ask and stops drawing it when the answer has come back.
    //
    // DESIGN.md's decision on git writes is that every write sits behind the token and
    // a confirm, and a confirm that is a second press of the same button is one the hand learns to
    // press twice. So it is a real dialog: modal, focus on the confirm, Escape cancels, Tab stays
    // inside it. A click on the ground behind it cancels too, which is the way out for a pointer.
    //
    // A confirm left open in a tab the pane hides keeps no focus, so the confirm takes the keyboard
    // again when its tab shows, and Escape and Tab reach it as before.
    //
    // The keyboard comes back to the control the dialog was raised from when the dialog goes, so a
    // cancel leaves the reader where they pressed. A yes may take that control off the page, and
    // the strip it was in is then what says where the keyboard lands, so a control that has gone is
    // left alone here.

    import { onShown } from '$lib/ui/shown';

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

    let box: HTMLDivElement | undefined = $state();
    let yes: HTMLButtonElement | undefined = $state();

    /** The control that held the keyboard when the dialog was raised, read before it takes it. */
    const came = typeof document === 'undefined' ? null : document.activeElement;

    $effect(() => {
        yes?.focus();
    });

    $effect(() => (box === undefined ? undefined : onShown(box, () => yes?.focus())));

    // No dependency, so the body runs once and the cleanup runs when the dialog goes.
    $effect(() => () => {
        if (came instanceof HTMLElement && came.isConnected) came.focus();
    });

    /** Escape cancels, and Tab walks the two buttons and stops there: a modal owns the keyboard. */
    function pressed(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            oncancel();
            return;
        }
        if (event.key !== 'Tab' || box === undefined) return;
        const stops = [...box.querySelectorAll('button')];
        if (stops.length === 0) return;
        const first = stops[0];
        const last = stops[stops.length - 1];
        const on = document.activeElement;
        if (event.shiftKey && on === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && on === last) {
            event.preventDefault();
            first.focus();
        }
    }
</script>

<!-- The ground is a button so a pointer can leave the dialog the way Escape does; the dialog itself
     stops the press, so a click inside it never reaches the ground. -->
<div class="ground" onkeydown={pressed} role="presentation">
    <button type="button" class="behind" aria-label={cancel} onclick={oncancel}></button>
    <div class="box" bind:this={box} role="alertdialog" aria-modal="true" aria-label={message}>
        <p class="message">{message}</p>
        {#if detail !== ''}
            <p class="detail">{detail}</p>
        {/if}
        <div class="row">
            <button type="button" class="cancel" onclick={oncancel}>{cancel}</button>
            <button type="button" class="yes" bind:this={yes} onclick={onconfirm}>{confirm}</button>
        </div>
    </div>
</div>

<style>
    .ground {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
    }

    /* The ground behind the dialog: the page's own surface, most of the way opaque. A scrim of its
       own colour keeps the rule that a component paints only with the theme's surfaces. */
    .behind {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: var(--bg);
        opacity: 0.72;
        cursor: default;
    }

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
        font-size: var(--fs-sm);
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
        outline: 2px solid var(--accent);
        outline-offset: 1px;
    }
</style>
