<script lang="ts">
    // Layer 3, primitive. The text box a tree row holds while its name is typed, as VS Code's
    // explorer draws one in the row of a new file or of a renamed one. It takes the focus when it
    // is drawn, with the first `select` characters selected (a rename selects the name without its
    // extension), and holds nothing of its own beyond the text: every change goes out as a call.
    //
    // Enter, Escape and leaving the box are the caller's three decisions, handed on with the text
    // as it stands: `onsubmit` for Enter (the caller may answer by keeping the box), `oncancel` for
    // Escape and `onleave` for a focus that went elsewhere. Each key typed in the box is kept from
    // the tree around it, whose arrow keys and type-ahead would otherwise take them. A message
    // (an error or a warning) is drawn under the box over the rows below it, so the row keeps its
    // height.
    //
    // A right-click on the box opens the text boxes' editing menu (TextBoxMenu.svelte), as a
    // TextInput's does.

    import { onMount } from 'svelte';
    import TextBoxMenu from '../controls/text/TextBoxMenu.svelte';
    import { boxValue } from '../controls/text/text-menu';

    type Props = {
        /** The text the box opens with. */
        value: string;
        /** The box's accessible name, already translated. */
        label: string;
        /** How many characters from the start the box opens with selected; all when omitted. */
        select?: number;
        /** What is wrong with the text, or worth saying about it; none draws no message. */
        message?: { text: string; error: boolean } | null;
        oninput: (value: string) => void;
        onsubmit: (value: string) => void;
        oncancel: () => void;
        onleave: (value: string) => void;
    };

    let {
        value,
        label,
        select,
        message = null,
        oninput,
        onsubmit,
        oncancel,
        onleave
    }: Props = $props();

    let box: HTMLInputElement | undefined = $state();

    onMount(() => {
        box?.focus({ preventScroll: true });
        box?.setSelectionRange(0, select ?? box.value.length);
    });

    function typed(event: Event): void {
        const typedValue = boxValue(event);
        if (typedValue !== null) oninput(typedValue);
    }

    function keys(event: KeyboardEvent): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            onsubmit(box?.value ?? '');
        } else if (event.key === 'Escape') {
            event.preventDefault();
            oncancel();
        }
    }
</script>

<span class="name-field">
    <TextBoxMenu {label} box={() => box ?? null}>
        <input
            class="field"
            type="text"
            autocomplete="off"
            spellcheck="false"
            {value}
            aria-label={label}
            aria-invalid={message?.error === true ? 'true' : undefined}
            oninput={typed}
            onkeydown={keys}
            onblur={() => onleave(box?.value ?? '')}
            bind:this={box}
        />
    </TextBoxMenu>
    {#if message !== null}
        <span class="message" class:error={message.error} role="alert">{message.text}</span>
    {/if}
</span>

<style>
    .name-field {
        position: relative;
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
    }

    .field {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
        height: calc(var(--tree-row) * var(--text-scale, 1) - 4px);
        border: 1px solid var(--accent);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: calc(var(--tree-font) * var(--text-scale, 1));
        padding: 0 4px;
    }

    .field[aria-invalid='true'] {
        border-color: var(--c-red);
    }

    .field:focus-visible {
        outline: none;
    }

    .message {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 2;
        box-sizing: border-box;
        padding: 3px 6px;
        border: 1px solid var(--c-amber);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-sm);
        line-height: 1.3;
    }

    :global(body.wall) .message {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .message.error {
        border-color: var(--c-red);
        color: var(--c-red-txt);
    }
</style>
