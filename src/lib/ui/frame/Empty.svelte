<script lang="ts">
    // Layer 3, primitive. What a view says when it has nothing to show or something failed. The
    // words are the view's, since only the view knows what is missing and why; this gives them the
    // same shape everywhere. The message is drawn through CodeText, so a backticked key in it (a
    // manifest field, a file) is drawn as code and any markup in it is drawn as characters.
    //
    // An empty state is VS Code's welcome view: centred, the glyph over the words, padded
    // 0 20px 1em, the side padding no more than 8% of the width it is given, so a message in a
    // narrow pane keeps the room to break between words. An error is VS Code's input message box:
    // left aligned, a red border and tint, 12px words on 17px lines, and the view's retry control
    // after the words as `action`. Under the rice theme an empty state is a shell comment: `# `
    // and the message on one line, left aligned, and the action on the line under it.
    //
    // Over a wallpaper an empty state is read off a `Surface`, which paints nothing inside a card,
    // a lane or a tinted box. The error box is one layer of its own: its red tint is opaque, so it
    // takes no surface under it.

    import type { Snippet } from 'svelte';
    import CodeText from '../display/text/CodeText.svelte';
    import Glyph from '../display/Glyph.svelte';
    import Surface from './Surface.svelte';

    type Props = {
        /** What is not here or what failed, already translated by the view. */
        message: string;
        /** A name in `glyphs:`, drawn before the message. */
        glyph?: string;
        /** Draw the message as an error in a box. */
        error?: boolean;
        /** The view's control after the words, usually a small text button that tries again. */
        action?: Snippet;
    };

    let { message, glyph, error = false, action }: Props = $props();
</script>

{#snippet said()}
    <p class="empty" class:error role={error ? 'alert' : undefined}>
        {#if glyph !== undefined}
            <Glyph name={glyph} />
        {/if}
        <span class="message">
            <CodeText text={message} />
        </span>
        {#if action}
            <span class="action">{@render action()}</span>
        {/if}
    </p>
{/snippet}

{#if error}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render said()}
{:else}
    <Surface>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render said()}
    </Surface>
{/if}

<style>
    .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin: 0;
        padding: 0 min(20px, 8%) 1em;
        text-align: center;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    /* The box: a red border and tint, 4px of room (.4em) round 12px words on 17px lines. */
    .empty.error {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 0.4em;
        border: 1px solid var(--c-red);
        background: var(--c-red-bg);
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
        line-height: calc(17px * var(--text-scale, 1));
        text-align: left;
    }

    .message {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    /*
     * The terminal shape: a shell comment, left aligned. The `# ` mark, the glyph and the message
     * run as one line of text, which wraps in a narrow pane, and the action sits on the line under
     * it. The error box keeps its flex row. The monospace face is the option `rice.monospace`'s.
     */
    :global(body.rice) .empty {
        padding: 10px 0;
        text-align: left;
    }

    :global(body.rice:where(:not(.rice-sans))) .empty {
        font-family: var(--font-mono);
    }

    :global(body.rice) .empty:not(.error) {
        display: block;
    }

    :global(body.rice) .empty:not(.error) .action {
        display: block;
        margin-top: 6px;
    }

    :global(body.rice) .empty.error {
        padding: 0.4em;
        font-size: var(--fs-sm);
    }

    :global(body.rice) .empty::before {
        content: '# ';
        opacity: 0.8;
    }
</style>
