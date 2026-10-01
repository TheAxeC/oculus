<script lang="ts">
    // Layer 3, primitive. A dialog that asks for a line or two of text before a write: a stash's
    // message, a tag's name and message. It stands on the modal ground ui/frame/Modal.svelte draws
    // and is modal as ui/controls/Confirm.svelte is: focus on the first field, Enter answers yes,
    // Escape cancels, Tab stays inside, and a press on the ground behind it cancels. The fields are
    // TextInput.svelte beside it, so the prompt holds only what has been typed until it answers,
    // and nothing once it is gone.

    import Modal from '../frame/Modal.svelte';
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

    function answered(event: SubmitEvent): void {
        event.preventDefault();
        request.act([...values]);
    }
</script>

<Modal onclose={oncancel} onopen={() => box?.querySelector('input')?.focus()}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={request.message} bind:this={box}>
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
    {/snippet}
</Modal>

<style>
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
        font-size: var(--fs-md);
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
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        line-height: calc(var(--button-line) * var(--text-scale, 1));
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
