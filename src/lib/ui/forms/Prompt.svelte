<script lang="ts">
    // Layer 3, primitive. A dialog that asks for a line or two of text before a write: a stash's
    // message, a tag's name and message. It is modal as ui/controls/Confirm.svelte is: focus on the
    // first field, Enter answers yes, Escape cancels, Tab stays inside, and a press on the ground
    // behind it cancels. The fields are TextInput.svelte beside it, so the prompt holds only what
    // has been typed until it answers, and nothing once it is gone.

    import TextInput from './TextInput.svelte';
    import type { PromptRequest } from './prompt';

    type Props = {
        request: PromptRequest;
        /** The cancelling control's words, already translated. */
        cancel: string;
        oncancel: () => void;
    };

    let { request, cancel, oncancel }: Props = $props();

    let box: HTMLDivElement | undefined = $state();
    // The fields begin with what the request holds, once; after that what is typed is the prompt's.
    // svelte-ignore state_referenced_locally
    let values = $state(request.fields.map((field) => field.value));

    $effect(() => {
        box?.querySelector('input')?.focus();
    });

    function answered(event: SubmitEvent): void {
        event.preventDefault();
        request.act([...values]);
    }

    /** Escape cancels, and Tab walks the dialog's own controls and stops there. */
    function pressed(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            oncancel();
            return;
        }
        if (event.key !== 'Tab' || box === undefined) return;
        const stops = [...box.querySelectorAll<HTMLElement>('input, button')];
        const first = stops.at(0);
        const last = stops.at(-1);
        if (first === undefined || last === undefined) return;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
</script>

<div class="ground" onkeydown={pressed} role="presentation">
    <button type="button" class="behind" aria-label={cancel} onclick={oncancel}></button>
    <div class="box" bind:this={box} role="dialog" aria-modal="true" aria-label={request.message}>
        <form class="form" onsubmit={answered}>
            <p class="message">{request.message}</p>
            {#if (request.detail ?? '') !== ''}
                <p class="detail">{request.detail}</p>
            {/if}
            {#each request.fields as field, at (at)}
                <label class="field">
                    <span class="name">{field.label}</span>
                    <TextInput
                        value={values[at]}
                        label={field.label}
                        placeholder={field.placeholder}
                        oninput={(next: string) => (values[at] = next)}
                    />
                </label>
            {/each}
            <div class="row">
                <button type="button" class="cancel" onclick={oncancel}>{cancel}</button>
                <button type="submit" class="yes">{request.verb}</button>
            </div>
        </form>
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

    .behind {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: var(--bg);
        opacity: 0.72;
        cursor: default;
    }

    .form {
        display: contents;
    }

    .box {
        position: relative;
        width: min(30rem, 100%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    :global(body.wall) .box {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .message {
        margin: 0;
        font-size: var(--fs-sm);
    }

    .detail,
    .name {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 2px;
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
