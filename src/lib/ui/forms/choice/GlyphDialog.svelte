<script lang="ts">
    // Layer 3, primitive. The box a glyph is chosen in: the glyph vocabulary as GlyphSelect lists
    // it, each name beside its icon, with the caller's word for "no glyph" first, on a modal
    // ground. Choosing a name, that first entry included, hands it out and closes the box; Escape
    // or a press outside closes it and changes nothing. A stored value the vocabulary no longer
    // holds is shown as it is, which GlyphSelect does for a value its choices lack. The words are
    // the caller's.

    import Modal from '$lib/ui/frame/Modal.svelte';
    import GlyphSelect from './GlyphSelect.svelte';

    type Props = {
        /** The glyph name held now, or the empty string for none. */
        value: string;
        /** The names of the glyph vocabulary. */
        choices: string[];
        /** The box's title and the select's accessible name, already translated. */
        title: string;
        label: string;
        /** The word for the empty choice, already translated. */
        empty: string;
        /** A name was chosen; the empty string is the empty choice. */
        onpick: (name: string) => void;
        onclose: () => void;
    };

    let { value, choices, title, label, empty, onpick, onclose }: Props = $props();
</script>

<Modal {onclose}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={title}>
            <p class="message">{title}</p>
            <GlyphSelect {value} {label} {empty} {choices} onchange={onpick} />
        </div>
    {/snippet}
</Modal>

<style>
    .box {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 16rem;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    /* The box floats over the pane, so it keeps more of its colour than the pane does. */
    :global(body.wall) .box {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .message {
        margin: 0;
        font-size: var(--fs-md);
    }
</style>
